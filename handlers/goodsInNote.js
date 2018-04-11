var GoodsInNotes = function (models, event) {
    'use strict';

    var mongoose = require('mongoose');

    var GoodsInNotesHelper = require('../helpers/refunds');
    var GoodsInSchema = mongoose.Schemas.GoodsInNote;
    var GoodsOutSchema = mongoose.Schemas.GoodsOutNote;
    var stockReturnsSchema = mongoose.Schemas.stockReturns;
    var OrderRowsSchema = mongoose.Schemas.OrderRow;
    var locationSchema = mongoose.Schemas.locations;
    var OrderSchema = mongoose.Schemas.Order;
    var AvailabilitySchema = mongoose.Schemas.productsAvailability;
    var AvailabilityHelper = require('../helpers/availability')(models);
    var AvailabilityService = require('../services/productAvailability')(models);
    var JournalEntryService = require('../services/journalEntry')(models);

    var goodsNoteService = require('../services/goodsOutNotes')(models);
    var orderRowsService = require('../services/orderRows')(models);
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');

    var goodsInNotesHelper = new GoodsInNotesHelper(models);

    var async = require('async');
    var _ = require('lodash');
    var JournalEntryHandler = require('./journalEntry');
    var journalEntry = new JournalEntryHandler(models);
    var path = require('path');

    this.create = function (req, res, next) {
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var body = req.body;
        var user = req.session.uId;
        var dbName = req.session.lastDb;
        var goodsInNote;

        if (body.status && body.status.received) {
            if (!body.status) {
                body.status = {};
            }
            
            body.status.receivedOn = body.date ? new Date(body.date) : new Date();
            body.status.receivedById = user;
        }

        goodsInNote = new GoodsInNote(body);

        goodsInNote.createdBy.user = user;

        goodsInNote.save(function (err, result) {

            if (err) {
                return next(err);
            }

            GoodsInNote.findById(result._id).populate('order', 'shippingMethod shippingExpenses').exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                // AvailabilityHelper.receiveProducts({
                //     dbName     : dbName,
                //     uId        : user,
                //     goodsInNote: result.toJSON()
                // }, function (err) {

                //     if (err) {
                //         return next(err);
                //     }

                //     if (result && result.order) {
                //         event.emit('recalculateStatus', req, result.order._id, next);
                //     }
                // });
                res.status(200).send(result);

            });
        });
    };

    this.createReturn = function (req, res, next) {
        var data = req.body;
        var user = req.session.uId;
        var dbName = req.session.lastDb;
        var options;

        if (!data.status) {
            data.status = {};
        }

        data.status.receivedOn = new Date();
        data.status.receivedById = user;

        options = {
            data  : data,
            dbName: dbName
        };

        goodsInNotesHelper.createProductReturn(options, function (err, order) {
            if (err) {
                return next(err);
            }

            if (order) {
                event.emit('recalculateStatus', req, order, next);
            }

            res.status(200).send({success: true});
        });
    };

    this.getForView = function (req, res, next) {
        var viewType = req.query.viewType;
        var id = req.query.id || req.params.id;

        if (id && id.length >= 24) {
            return getGoodsNoteById(req, res, next);
        } else if (id && id.length < 24) {
            return res.status(400).send();
        }

        switch (viewType) {
            case 'list':
            case 'thumbnails':
                getGoodsNotesFilter(req, res, next);
                break;
            case 'form':
                getGoodsNoteById(req, res, next);
                break;
            default:
                getAll(req, res, next);
                break;
        }
    };

    function getAll(req, res, next) {
        var Product = models.get(req.session.lastDb, 'Product', ProductSchema);
        var queryObject = {};
        var query = req.query;
        var projection = query.projection || {};

        if (query && query.canBeSold === 'true') {
            queryObject.canBeSold = true;

            // todo change it for category
            /* if (query.service === 'true') {
             key = 'info.productType';
             queryObject[key] = 'Service';
             }*/
        } else {
            queryObject.canBePurchased = true;
        }

        Product.find(queryObject, projection, function (err, products) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: products});
        });
    }

    function getGoodsNotesFilter(req, res, next) {
        var mid = req.query.contentType === 'salesProduct' ? 65 : 58;

        var query = req.query;
        var optionsObject = {$and: []};
        var sort = {};
        var paginationObject = pageHelper(query);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var filterMapper = new FilterMapper();
        var key;

        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);

        optionsObject.$and.push({_type: 'GoodsInNote'});

        if (query && query.sort) {
            key = Object.keys(query.sort)[0].toString();
            query.sort[key] = parseInt(query.sort[key], 10);
            sort = query.sort;
        } else {
            sort = {'createdBy.date': -1};
        }

        if (query.filter && typeof query.filter === 'object') {
            optionsObject.$and.push(filterMapper.mapFilter(query.filter, query.contentType)); // caseFilter(query.filter);
        }

        GoodsInNote.aggregate([{
            $match: {
                archived: {$ne: true}
            }
        }, {
            $lookup: {
                from        : 'Order',
                localField  : 'order',
                foreignField: '_id',
                as          : 'order'
            }
        }, {
            $lookup: {
                from        : 'warehouse',
                localField  : 'warehouse',
                foreignField: '_id',
                as          : 'warehouse'
            }
        }, {
            $project: {
                name     : 1,
                warehouse: {$arrayElemAt: ['$warehouse', 0]},
                order    : {$arrayElemAt: ['$order', 0]},
                status   : 1,
                createdBy: 1,
                date     : 1,
                isValid  : 1,
                _type    : 1,
                shippinglist : 1,
                description : 1
            }

        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'order.supplier',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'order.workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                name            : 1,
                order           : 1,
                status          : 1,
                'warehouse._id' : '$warehouse._id',
                'warehouse.name': '$warehouse.name',
                workflow        : {$arrayElemAt: ['$workflow', 0]},
                customer        : {$arrayElemAt: ['$customer', 0]},
                isValid         : 1,
                _type           : 1,
                date            : 1,
                createdBy       : 1,
                shippinglist    : 1,
                description     : 1
            }
        }, {
            $project: {
                name           : 1,
                'order._id'    : 1,
                'order.name'   : 1,
                'order.project': 1,
                status         : 1,
                warehouse      : 1,
                date           : 1,
                'workflow._id' : 1,
                'workflow.name': 1,
                'customer._id' : 1,
                'customer.name': {$concat: ['$customer.name.first', ' ', '$customer.name.last']},
                isValid        : 1,
                _type          : 1,
                createdBy      : 1,
                shippinglist   : 1,
                description    : 1
            }
        }, {
            $match: optionsObject
        }, {
            $group: {
                _id  : null,
                total: {$sum: 1},
                root : {$push: '$$ROOT'}
            }
        }, {
            $unwind: '$root'
        }, {
            $project: {
                _id      : '$root._id',
                name     : '$root.name',
                order    : '$root.order',
                status   : '$root.status',
                warehouse: '$root.warehouse',
                workflow : '$root.workflow',
                customer : '$root.customer',
                createdBy: '$root.createdBy',
                isValid  : '$root.isValid',
                date     : '$root.date',
                total    : 1,
                shipped  : '$root.status.shipped',
                printed  : '$root.status.printed',
                picked   : '$root.status.picked',
                packed   : '$root.status.packed',
                approved : '$root.status.approved',
                shippinglist : '$root.shippinglist',
                description : '$root.description'
            }
        }, {
            $sort: sort
        }, {
            $skip: skip
        }, {
            $limit: limit
        }])
            .exec(function (err, result) {
                var count;
                var firstElement;
                var response = {};

                if (err) {
                    return next(err);
                }

                firstElement = result[0];
                count = firstElement && firstElement.total ? firstElement.total : 0;
                response.total = count;
                response.data = result;

                res.status(200).send(response);
            });
    }

    function getGoodsNoteById(req, res, next) {
        var id = req.query.id || req.params.id;
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var Location = models.get(req.session.lastDb, 'location', locationSchema);
        var query;

        if (id.length < 24) {
            return res.status(400).send();
        }

        query = GoodsInNote.findById(id);

        query
            .populate('createdBy.user')
            .populate('editedBy.user')
            .populate('shippingMethod')
            .exec(function (err, result) {

                if (err) {
                    return next(err);
                }

                var Ids = result.orderRows.map(function (element) {
                    return element.orderRowId;
                });

                result = result.toJSON();
                

                OrderRows.find({$and: [{_id: {$in: Ids}}, {product: {$ne: null}}]})
                    .populate('product')
                    .populate('order')
                    .exec(function (err, orderRows) {
                        var orderRowsIds;

                        if (err) {
                            return next(err);
                        }

                        orderRowsIds = orderRows.map(function (element) {
                            return element._id;
                        });

                        GoodsInNote.find({
                            'orderRows.orderRowId': {$in: orderRowsIds}
                        }, {
                            'orderRows': 1,
                            status     : 1,
                            invoiceName    : 1
                        })
                            .populate('orderRows.locationsReceived.location')
                            .populate('orderRows.taxCode')
                            .exec(function (err, docs) {
                                if (err) {
                                    return next(err);
                                }

                                orderRows = orderRows.map(function (element) {
                                    return element.toJSON();
                                });

                                orderRows.forEach(function (el) {
                                    el.shipped = 0;
                                    el.selectedQuantity = 0;

                                    docs.forEach(function (element) {
                                        var elementOrderRow = _.find(element.orderRows, {orderRowId: el._id});
                                        var quantity = 0;

                                        if (elementOrderRow) {
                                            quantity = elementOrderRow.quantity;
                                            if (element._id.toString() === result._id.toString()) {
                                                el.selectedQuantity = quantity;
                                                el.locationsReceived = elementOrderRow.locationsReceived;
                                                el.params = elementOrderRow.parameters;
                                                el.cost = elementOrderRow.cost;
                                                el.unitPrice = elementOrderRow.unitPrice;
                                                el.weightPrice = elementOrderRow.weightPrice;
                                                el.unit = elementOrderRow.unit;
                                                el.taxCode = elementOrderRow.taxCode;
                                                el.tax = elementOrderRow.tax;
                                            }

                                            if (element.status.shipped) {
                                                el.shipped += quantity;
                                                el.selectedQuantity = 0;
                                            }
                                        }
                                    });
                                    el.quantity -= (el.shipped + el.selectedQuantity);
                                });

                                result.orderRows = orderRows;

                                Order.findById(result.order)
                                    .populate('supplier')
                                    .exec(function (err, doc) {
                                        if (err) {
                                            return next(err);
                                        }

                                        result.order = doc;

                                        res.status(200).send(result);
                                    });

                            });
                    });

            });
    }

    function bulkRemove(options, res, next) {
        var req = options.req;
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var ids = options.ids || [];

        async.each(ids, function (id, cb) {
            GoodsInNote.findById(id).populate('order').exec(function (err, goodsNote) {
                var options;


                if (err) {
                    return cb(err);
                }

                if (goodsNote && goodsNote.order) {
                    event.emit('recalculateStatus', req, goodsNote.order, next);

                    async.each(goodsNote.orderRows, function (goodsOrderRow, callback) {

                        // AvailabilityService.tryToRempve({
                        //     dbName: req.session.lastDb,
                        //     query : {
                        //         goodsInNote: goodsNote._id,
                        //         product    : goodsOrderRow.product,
                        //         quantity   : goodsOrderRow.quantity,
                        //         warehouse  : goodsNote.warehouse
                        //     }
                        // }, function (err) {
                        //     if (err) {
                        //         return callback(err);
                        //     }
                        // });

                        options = {
                            dbName: req.session.lastDb,
                            query : {
                                'sourceDocument.model': 'goodsInNote',
                                'sourceDocument._id'  : id
                            }
                        };

                        JournalEntryService.remove(options);

                        callback();
                    }, function (err) {
                        if (err) {
                            return cb(err);
                        }

                        cb();
                    });

                } else {
                    cb();
                }
            });
        }, function (err) {
            if (err) {
                return next(err);
            }

            GoodsInNote.remove({_id: {$in: ids}}, function (err, result) {
                if (err) {
                    return next(err);
                }

                if (typeof  res.status === 'function') {
                    return res.status(200).send({success: 'Removed success'});
                }

                res();
            });
        });
    }

    this.removeByOrder = function (options, cb) {
        bulkRemove(options, cb, cb);
    };

    this.bulkRemove = function (req, res, next) {
        var options = {
            dbName: req.session.lastDb,
            ids   : req.body.ids,
            req   : req
        };
        bulkRemove(options, res, next);
    };

    this.confirmIssue = function(req, res, next){
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var id = req.query.id;
        var user = req.session.uId;
        var dbName = req.session.lastDb;
        var goodsInNote;
        var orderRows = req.query.orderRows;
        var invoiceName = req.query.invoiceName;
        var isValid = req.query.isValid;
        var status = req.query.status;
        var newstatus = {
            received    : status.received,
            receivedOn  : status.receivedOn,
            receivedById: status.receivedById,
            approved    : true,
            approvedOn  : new Date(),
            approvedById: user
        };


        GoodsInNote.findByIdAndUpdate(id, {status: newstatus, orderRows: orderRows, isValid: isValid, invoiceName: invoiceName}, {dbName: dbName})
                   .populate('order', 'shippingMethod shippingExpenses')
                   .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    AvailabilityHelper.receiveProducts({
                        dbName     : dbName,
                        uId        : user,
                        goodsInNote: result.toJSON()
                    }, function (err) {

                        if (err) {
                            return next(err);
                        }

                        if (result && result.order) {
                            event.emit('recalculateStatus', req, result.order._id, next);
                        }
                    });

                    res.status(200).send(result);

        });
    };

    this.goodsInNew = function(req, res, next){
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var objectId = mongoose.Types.ObjectId;
        var id = req.query.id;
        var body1 = req.query.body1;
        var body2 = req.query.body2;
        var newmark = req.query.newmark;
        var oldmark = req.query.oldmark;
        var user = req.session.uId;
        var dbName = req.session.lastDb;
        var goodsInNote1;  //offical data
        var goodsInNote2;   //offset data
        var goodsInNote1Id;
        var goodsInNote2Id;
        var query;
        var queryObject={goodsInNote: id};
        var PA = [];


        if (body1.status && body1.status.received && body2.status && body2.status.received) {
            if (!body1.status && !body2.status) {
                body1.status = {};
                body2.status = {};
            }
            
            body1.status.receivedOn = new Date();
            body1.status.receivedById = user;
            body1.status.approved = true;
            body1.status.approvedOn = new Date();
            body1.status.approvedById = user;
            
            body2.status.receivedOn = new Date();
            body2.status.receivedById = user;
            body2.status.approved = true;
            body2.status.approvedOn = new Date();
            body2.status.approvedById = user;
        }

        goodsInNote1 = new GoodsInNote(body1);
        goodsInNote2 = new GoodsInNote(body2);

        goodsInNote1.createdBy.user = user;
        goodsInNote2.createdBy.user = user;

        goodsInNote1.save(function (err, result) {
            if (err) {
                return next(err);
            }

            goodsInNote2.save(function (err, result1) {
                if (err) {
                    return next(err);
                }
                GoodsInNote.findByIdAndUpdate(id, {description: result1.name + ' ' + oldmark, invoiceName: null, isValid: false}, {dbName: dbName})
                           .exec(function (err, result2) {
                                if (err) {
                                    return next(err);
                                }

                            GoodsInNote.findByIdAndUpdate(result._id, {description: result2.name + newmark}, {dbName: dbName})
                                        .exec(function (err, result3) {
                                            if (err) {
                                                return next(err);
                                            }
                                            AvailabilityHelper.receiveProducts({
                                                dbName     : dbName,
                                                uId        : user,
                                                goodsInNote: result3.toJSON()
                                            }, function (err) {

                                                if (err) {
                                                    return next(err);
                                                }
                                                GoodsInNote.findByIdAndUpdate(result1._id, {description: result2.name + '(冲账入库单)'}, {dbName: dbName})
                                                            .exec(function (err, result4) {
                                                                if (err) {
                                                                    return next(err);
                                                                }
                                                                AvailabilityHelper.receiveProducts({
                                                                    dbName     : dbName,
                                                                    uId        : user,
                                                                    goodsInNote: result4.toJSON()
                                                                }, function (err) {
                                                                    if (err) {
                                                                        return next(err);
                                                                    }

                                                                    GoodsOutNote.aggregate([
                                                                        {
                                                                            $project: {
                                                                                warehouse   : 1,
                                                                                order       : 1,
                                                                                orderRows   : 1,
                                                                                status      : 1,
                                                                                name        : 1
                                                                            }
                                                                        },
                                                                        {
                                                                            $unwind : '$orderRows'
                                                                        },
                                                                        {
                                                                            $project: {
                                                                                warehouse   : 1,
                                                                                order       : 1,
                                                                                status      : 1,
                                                                                orderRowId  : '$orderRows.orderRowId',
                                                                                product     : '$orderRows.product',
                                                                                gnotesDeliver: '$orderRows.gnotesDeliver',
                                                                                cost        : '$orderRows.cost',
                                                                                name        : 1
                                                                            }
                                                                        },
                                                                        {
                                                                            $unwind : '$gnotesDeliver'
                                                                        },
                                                                        {
                                                                            $project: {
                                                                                warehouse   : 1,
                                                                                order       : 1,
                                                                                status      : 1,
                                                                                orderRowId  : 1,
                                                                                product     : 1,
                                                                                location    : '$gnotesDeliver.location',
                                                                                goodsInNoteId: '$gnotesDeliver.goodsInNoteId',
                                                                                quantity    : '$gnotesDeliver.quantity',
                                                                                cost        : 1,
                                                                                name        : 1
                                                                            }
                                                                        },
                                                                        {
                                                                            $lookup: {
                                                                                from        : 'Order',
                                                                                localField  : 'order',
                                                                                foreignField: '_id',
                                                                                as          : 'order'
                                                                            }
                                                                        },
                                                                        {
                                                                            $match : {goodsInNoteId : objectId(id)}
                                                                        },
                                                                        {
                                                                            $project: {
                                                                                warehouse   : 1,
                                                                                order       : {$arrayElemAt: ['$order._id', 0]},
                                                                                ordername   : {$arrayElemAt: ['$order.name', 0]},
                                                                                status      : 1,
                                                                                orderRowId  : 1,
                                                                                product     : 1,
                                                                                location    : 1,
                                                                                goodsInNoteId: 1,
                                                                                quantity    : 1,
                                                                                cost        : 1,
                                                                                name        : 1
                                                                            }
                                                                        }], function(err, result5){
                                                                            if(err){
                                                                                return next(err);
                                                                            }
                                                                            async.each(result5, function(item, asyncCb){
                                                                                var body3;
                                                                                var body4;
                                                                                var orderRows1=[];  //冲账
                                                                                var orderRows2=[];   //正式
                                                                                var createdBy = {
                                                                                    user: user,
                                                                                    date: new Date()
                                                                                };
                                                                                var editedBy = {
                                                                                    user: user,
                                                                                    date: new Date()
                                                                                };
                                                                                var gnotesDeliver1 = [{location:item.location, goodsInNoteId: id, quantity: item.quantity*(-1)}];
                                                                                var gnotesDeliver2 = [{location:item.location, goodsInNoteId: id, quantity: item.quantity}];
                                                                                orderRows1.push({
                                                                                    orderRowId      : item.orderRowId,
                                                                                    product         : item.product,
                                                                                    gnotesDeliver   : gnotesDeliver1,
                                                                                    cost            : item.cost,
                                                                                    quantity        : item.quantity*(-1)
                                                                                });
                                                                                orderRows2.push({
                                                                                    orderRowId      : item.orderRowId,
                                                                                    product         : item.product,
                                                                                    gnotesDeliver   : gnotesDeliver2,
                                                                                    cost            : item.cost,
                                                                                    quantity        : item.quantity
                                                                                });
                                                                                body3 = {
                                                                                    status      : item.status,
                                                                                    orderRows   : orderRows1,
                                                                                    order       : item.order,
                                                                                    name        : item.ordername,
                                                                                    createdBy   : createdBy,
                                                                                    editedBy    : editedBy,
                                                                                    description : item.name,
                                                                                    warehouse   : item.warehouse 
                                                                                };
                                                                                body4 = {
                                                                                    status      : item.status,
                                                                                    orderRows   : orderRows2,
                                                                                    order       : item.order,
                                                                                    name        : item.ordername,
                                                                                    createdBy   : createdBy,
                                                                                    editedBy    : editedBy,
                                                                                    description : item.name,
                                                                                    warehouse   : item.warehouse 
                                                                                };
                                                                                var GoodsOutNote1 = new GoodsOutNote(body3);
                                                                                var GoodsOutNote2 = new GoodsOutNote(body4);
                                                                                GoodsOutNote1.save(function (err, result6) {
                                                                                    if (err) {
                                                                                        return next(err);
                                                                                    }
                                                                                    GoodsOutNote2.save(function (err, result7) {
                                                                                        if (err) {
                                                                                            return next(err);
                                                                                        }
                                                                                        Availability.findOne({location: item.location, product: item.product})
                                                                                                    .exec(function (err, result8) {
                                                                                                        var GO1 = result8.goodsOutNotes ? result8.goodsOutNotes : [];
                                                                                                        GO1.push({
                                                                                                            goodsNoteId: result6._id,
                                                                                                            quantity   : item.quantity*(-1)
                                                                                                        });
                                                                                                        GO1.push({
                                                                                                            goodsNoteId: result7._id,
                                                                                                            quantity   : item.quantity
                                                                                                        })
                                                                                                        Availability.findByIdAndUpdate(result8._id, {goodsOutNotes: GO1}, {new:true}, function(err){
                                                                                                            if (err) {
                                                                                                                return next(err);
                                                                                                            }
                                                                                                            GoodsOutNote.findByIdAndUpdate(item._id, {description: result6.name}, {dbName: dbName})
                                                                                                                        .exec(function (err, result9) {
                                                                                                                            if (err) {
                                                                                                                                return next(err);
                                                                                                                            }
                                                                                                                            asyncCb(null, 'ok');
                                                                                                                        });
                                                                                                        });
                                                                                                    });  
                                                                                    });
                                                                                });
                                                                            }, function(err){
                                                                                if(err) {
                                                                                    return next(err)
                                                                                }
                                                                            });
                                                                            Availability.aggregate([
                                                                                {
                                                                                    $project : {
                                                                                        orderRows   : 1
                                                                                    }
                                                                                },
                                                                                {
                                                                                    $match : {
                                                                                        orderRows : {$ne: null}
                                                                                    }
                                                                                }], function(err, result10){
                                                                                    if(err){
                                                                                        return next(err);
                                                                                    }
                                                                                    async.each(result10, function(item2, pcb){
                                                                                        async.map(item2.orderRows, function(orderRow, pcb2) {
                                                                                            if(orderRow.goodsInNoteId.toString()===id.toString()){
                                                                                                orderRow.goodsInNoteId = objectId(result3._id);
                                                                                            }
                                                                                            pcb2(null, orderRow);
                                                                                        }, function(err, orderRows){
                                                                                            if(err){
                                                                                                return next(err);
                                                                                            }
                                                                                            Availability.findByIdAndUpdate(item2._id, {orderRows: orderRows}, {new: true}, function(err, result11){
                                                                                                if(err){
                                                                                                    return next(err);
                                                                                                }
                                                                                            });
                                                                                        });
                                                                                        pcb(null);
                                                                                    },function(err){
                                                                                        if(err){
                                                                                            return next(err);
                                                                                        }
                                                                                        res.status(200).send('ok');
                                                                                    });
                                                                                });
                                                                        });
                                                                });
                                                            });
                                                });
                                            });
                                        });
            });
        });
    };

    this.goodsInNewspecial = function(req, res, next){
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var objectId = mongoose.Types.ObjectId;
        var id = req.query.id;
        var body1 = req.query.body1;
        var body2 = req.query.body2;
        var oldmark = req.query.oldmark;
        var newmark = req.query.newmark;
        var user = req.session.uId;
        var dbName = req.session.lastDb;
        var goodsInNote1;  //正式入库单
        var goodsInNote2;   //冲账入库单
        var goodsInNote1Id;
        var goodsInNote2Id;
        var query;
        var queryObject={goodsInNote: id};
        var PA = [];


        if (body1.status && body1.status.received && body2.status && body2.status.received) {
            if (!body1.status && !body2.status) {
                body1.status = {};
                body2.status = {};
            }
            
            body1.status.receivedOn = new Date();
            body1.status.receivedById = user;
            body1.status.approved = true;
            body1.status.approvedOn = new Date();
            body1.status.approvedById = user;
            
            body2.status.receivedOn = new Date();
            body2.status.receivedById = user;
            body2.status.approved = true;
            body2.status.approvedOn = new Date();
            body2.status.approvedById = user;
        }

        goodsInNote1 = new GoodsInNote(body1);
        goodsInNote2 = new GoodsInNote(body2);

        goodsInNote1.createdBy.user = user;
        goodsInNote2.createdBy.user = user;

        goodsInNote1.save(function (err, result) {
            if (err) {
                return next(err);
            }

            goodsInNote2.save(function (err, result1) {
                if (err) {
                    return next(err);
                }
                GoodsInNote.findByIdAndUpdate(id, {description: result1.name + ' ' + oldmark}, {dbName: dbName})
                           .exec(function (err, result2) {
                                if (err) {
                                    return next(err);
                                }

                            GoodsInNote.findByIdAndUpdate(result._id, {description: result2.name + newmark}, {dbName: dbName})
                                        .exec(function (err, result3) {
                                            if (err) {
                                                return next(err);
                                            }
                                            AvailabilityHelper.receiveProducts({
                                                dbName     : dbName,
                                                uId        : user,
                                                goodsInNote: result3.toJSON()
                                            }, function (err) {

                                                if (err) {
                                                    return next(err);
                                                }
                                                GoodsInNote.findByIdAndUpdate(result1._id, {description: result2.name + '(冲账入库单)'}, {dbName: dbName})
                                                            .exec(function (err, result4) {
                                                                if (err) {
                                                                    return next(err);
                                                                }
                                                                AvailabilityHelper.receiveProducts({
                                                                    dbName     : dbName,
                                                                    uId        : user,
                                                                    goodsInNote: result4.toJSON()
                                                                }, function (err) {

                                                                    if (err) {
                                                                        return next(err);
                                                                    }

                                                                    Availability.aggregate([
                                                                        {
                                                                            $project : {
                                                                                orderRows   : 1
                                                                            }
                                                                        },
                                                                        {
                                                                            $match : {
                                                                                orderRows : {$ne: null}
                                                                            }
                                                                        }], function(err, result5){
                                                                            if(err){
                                                                                return next(err);
                                                                            }
                                                                            async.each(result5, function(item, pcb){
                                                                                async.map(item.orderRows, function(orderRow, pcb2) {
                                                                                    if(orderRow.goodsInNoteId.toString()===id.toString()){
                                                                                        orderRow.goodsInNoteId = objectId(result3._id);
                                                                                    }
                                                                                    pcb2(null, orderRow);
                                                                                }, function(err, orderRows){
                                                                                    if(err){
                                                                                        return next(err);
                                                                                    }
                                                                                    Availability.findByIdAndUpdate(item._id, {orderRows: orderRows}, {new: true}, function(err, result6){
                                                                                        if(err){
                                                                                            return next(err);
                                                                                        }
                                                                                    });
                                                                                });
                                                                                pcb(null);
                                                                            },function(err){
                                                                                if(err){
                                                                                    return next(err);
                                                                                }
                                                                                if (result4 && result4.order) {
                                                                                    event.emit('recalculateStatus', req, result4.order._id, next);
                                                                                }
                                                                                res.status(200).send('ok');
                                                                            });
                                                                        });
                                                                });
                                                            });
                                                });
                                            });
                                        });
            });
        }); 
    };

    this.goodsOutCreate = function(req, res, next){
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var id = req.query.id;
        var Premium = req.query.Premium;
        var user = req.session.uId;
        var queryObject={goodsInNote: id};
        var dbName = req.session.lastDb;
        var objectId = mongoose.Types.ObjectId;

        GoodsInNote.aggregate([
            {
                $match:{
                    _id : objectId(id)
                }
            },
            {
                $project:{
                    warehouse  : 1,
                    orderRows  : 1
                }
            },
            {
                $unwind:'$orderRows'
            },
            {
                $project:{
                    warehouse : 1,
                    product    : '$orderRows.product',
                    locationsReceived : '$orderRows.locationsReceived'
                }
            },
            {
                $unwind:'$locationsReceived'
            },
            {
                $project:{
                    warehouse : 1,
                    product   : 1,
                    location  : '$locationsReceived.location',
                    quantity  : '$locationsReceived.quantity'
                }
            },
            {
                $sort:{quantity: -1}
            }], function(err, result){
                if (err) {
                    return next(err);
                }
                var maxlocation = result[0].location;
                var maxproduct = result[0].product;
                var maxid = result[0]._id;
                var maxwarehouse = result[0].warehouse;
                var body;
                var orderRows=[];
                var status;
                var createdBy = {
                    user: user,
                    date: new Date()
                };
                var editedBy = {
                    user: user,
                    date: new Date()
                };
                status = {
                    shipped    : true,
                    picked     : true,
                    packed     : true,
                    printed    : true,
                    shippedOn  : new Date(),
                    pickedOn   : new Date(),
                    packedOn   : new Date(),
                    printedOn  : new Date(),
                    pickedById : user,
                    packedById : user,
                    shippedById: user,
                    printedById: user,
                    approved   : true,
                    approvedOn : new Date(),
                    approvedById: user
                };
                orderRows.push({
                    orderRowId      : null,
                    product         : maxproduct,
                    gnotesDeliver   : [],
                    cost            : Premium,
                    quantity        : 0
                });
                body = {
                    status      : status,
                    orderRows   : orderRows,
                    order       : null,
                    createdBy   : createdBy,
                    editedBy    : editedBy,
                    description : null,
                    warehouse   : maxwarehouse 
                };
                var goodsOutNote1 = new GoodsOutNote(body);
                goodsOutNote1.save(function (err, result1) {
                    if (err) {
                        return next(err);
                    }
                    Availability.findOne({product: maxproduct, location: maxlocation},function(err, result2) {
                        if(err){
                            return next(err);
                        }
                        var GO = result2.goodsOutNotes ? result2.goodsOutNotes : [];
                        GO.push({
                            goodsNoteId: result1._id,
                            quantity   : 0
                        });
                        Availability.findByIdAndUpdate(result2._id, {goodsOutNotes: GO}, {new:true},function(err){
                            if (err) {
                                return next(err);
                            }
                            res.status(200).send(result2);
                        });
                    });
                });

            });
    };

    this.getGoodsInNote = function(req, res, next) {
        var data = req.query;
        var optionsObject = {$and: []};
        var sort = {};
        var filter = data.filter || {};
        var startDay = new Date(filter.date.value[0]);
        var endDay = new Date(filter.date.value[1]);

        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);

        GoodsInNote.aggregate([{
            $match: {
                archived: {$ne: true}
            }
        }, {
            $match: {
                _type      : 'GoodsInNote',
                date       : {$gte: startDay, $lte: endDay}
            }
        }, {
            $lookup: {
                from        : 'Order',
                localField  : 'order',
                foreignField: '_id',
                as          : 'order'
            }
        }, {
            $lookup: {
                from        : 'warehouse',
                localField  : 'warehouse',
                foreignField: '_id',
                as          : 'warehouse'
            }
        }, {
            $project: {
                name     : 1,
                warehouse: {$arrayElemAt: ['$warehouse', 0]},
                order    : {$arrayElemAt: ['$order', 0]},
                status   : 1,
                createdBy: 1,
                date     : 1,
                isValid  : 1,
                _type    : 1,
                shippinglist : 1,
                description : 1
            }

        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'order.supplier',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'order.project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'order.workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                name            : 1,
                order           : 1,
                project         : {$arrayElemAt: ['$project', 0]},
                status          : 1,
                'warehouse._id' : '$warehouse._id',
                'warehouse.name': '$warehouse.name',
                workflow        : {$arrayElemAt: ['$workflow', 0]},
                customer        : {$arrayElemAt: ['$customer', 0]},
                isValid         : 1,
                _type           : 1,
                date            : 1,
                createdBy       : 1,
                shippinglist    : 1,
                description     : 1
            }
        }, {
            $project: {
                name           : 1,
                'order._id'    : 1,
                'order.name'   : 1,
                'order.project': 1,
                'project._id'  : 1,
                'project.name' : 1,
                status         : 1,
                warehouse      : 1,
                date           : 1,
                'workflow._id' : 1,
                'workflow.name': 1,
                'customer._id' : 1,
                'customer.name': {$concat: ['$customer.name.first', ' ', '$customer.name.last']},
                isValid        : 1,
                _type          : 1,
                createdBy      : 1,
                shippinglist   : 1,
                description    : 1
            }
        }, {
            $group: {
                _id   : {customer:'$customer._id', project:'$project._id'},
                project: {$first: '$project.name'},
                customer: {$first: '$customer.name'},
                count : {$sum: 1}
            }
        }, {
            $project: {
                project  : 1,
                count : 1,
                customer: 1
            }
        }],function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.NotesCancel = function(req, res, next) {
        var id = req.query.id;
        var dbName = req.session.lastDb;
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        GoodsOutNote.aggregate([
        {
            $project:{
                orderRows : 1
            }
        },
        {
            $unwind:'$orderRows'
        },
        {
            $project:{
                gnotesDeliver: '$orderRows.gnotesDeliver'
            }
        },
        {
            $unwind:'$gnotesDeliver'
        },
        {
            $project:{
                goodsInNoteId: '$gnotesDeliver.goodsInNoteId'
            }
        },
        {
            $match:{goodsInNoteId: id}
        }], function(err, OutNotes){
            if(err){
                return next(err);
            }
            if(OutNotes.length != 0){
                var error = new Error('入库单产品已存在出库情况，无法取消审核。');
                error.status = 400;
                next(error);
            }else{
                Availability.find({"goodsInNotes.goodsNoteId": id})
                    .lean()
                    .exec(function(err, result){
                        if(err){
                            return next(err);
                        }
                        async.eachSeries(result, function(elem, cb){
                            var goodsInNotes = [];
                            var onHand = 0;
                            var allocated = false;
                            for (var i=0;i<elem.orderRows.length;i++){
                                if(elem.orderRows[i].goodsInNoteId == id){
                                    allocated = true;
                                    var error = new Error('入库单产品已存在分配情况，无法取消审核。');
                                    error.status = 400;
                                    cb(error);
                                    break;
                                }
                            }
                            if(allocated){
                                return;
                            }
                            elem.goodsInNotes.forEach(function (doc) {
                                if(doc.goodsNoteId != id){
                                    goodsInNotes.push(doc);
                                    onHand += doc.quantity;
                                }
                            });
                            Availability.findByIdAndUpdate(elem._id, {goodsInNotes : goodsInNotes, onHand: onHand}, function(err, result){
                                            if(err){
                                                cb(err);
                                            }
                                            cb(null);
                                        });
                        }, function(err){
                            if(err){
                                return next(err);
                            }
                            GoodsInNote.findByIdAndUpdate(id, {'status.approved':false},function(err ,goodsNote){
                                if(err){
                                    return next(err);
                                }
                                res.status(200).send('入库单完成取消审核!');
                            });
                        });
                    });
            }
        })
        
    };

};

module.exports = GoodsInNotes;
