var GoodsOutNotes = function (models, event) {
    'use strict';

    var mongoose = require('mongoose');

    var ProductSchema = mongoose.Schemas.Products;
    var GoodsOutSchema = mongoose.Schemas.GoodsOutNote;
    var GoodsInSchema = mongoose.Schemas.GoodsInNote;
    var OrgSettingsSchema = mongoose.Schemas.orgSettingsSchema;
    var AvailabilitySchema = mongoose.Schemas.productsAvailability;
    var locationsSchema = mongoose.Schemas.locations;
    var ProductSchema = mongoose.Schemas.Products;
    var OrderRowsSchema = mongoose.Schemas.OrderRow;
    var OrderSchema = mongoose.Schemas.Order;
    var BarCodeSchema = mongoose.Schemas.barCode;
    var JournalEntryHandler = require('./journalEntry');
    var journalEntry = new JournalEntryHandler(models);
    var AvailabilityService = require('../services/productAvailability')(models);
    var JournalEntryService = require('../services/journalEntry')(models);
    var AvailabilityService = require('../services/productAvailability')(models);
    var goodsOutNotesService = require('../services/goodsOutNotes')(models);

    var async = require('async');
    var _ = require('lodash');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');

    function updateOnlySelectedFields(req, res, next) {

        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var Availability = models.get(req.session.lastDb, 'productAvailability', AvailabilitySchema);
        var Order = models.get(req.session.lastDb, 'order', OrderSchema);
        var data = req.body;
        var id = req.params.id;
        var keys = Object.keys(data);

        var dbName = req.session.lastDb;
        var user = req.session.uId;

        keys.forEach(function (el) {
            if (el.split('.')[0] === 'status' && data[el]) {
                data[el + 'On'] = data.date ? new Date(data.date) : new Date();
                data[el + 'ById'] = req.session.uId;
            } else if (!data[el]) {
                data[el + 'On'] = null;
                data[el + 'ById'] = null;
            }
        });

        GoodsOutNote.findByIdAndUpdate(id, data, {new: true}).exec(function (err, result) {
            if (err) {
                return next(err);
            }
            
            if (data['status.approved']) {

                Order.findById(result.order).exec(function(err, order){
                    if(err){
                        return next(err);
                    }

                    if (result && result.orderRows.length) {
                        async.each(result.orderRows, function (orderRow, eachCb1) {
                            async.each(orderRow.gnotesDeliver, function (gnote, eachCb2) {
                                async.waterfall([
                                    function (wCb) {
                                        Availability.find({
                                            product : orderRow.product,
                                            warehouse : order.warehouse,
                                            location : gnote.location
                                        }, function (err, pas) {
                                            if (err) {
                                                return eachCb2(err);
                                            }

                                            pas.push(gnote);
                                            wCb(null, pas);
                                        });
                                    },

                                    function (pas, wCb) {
                                        var pa = pas[0];
                                        var gnote = pas[1];

                                        for(var i=0; i<pa.orderRows.length; i++){
                                            if(pa.orderRows[i].orderRowId.toString() === orderRow.orderRowId.toString()){
                                                pa.orderRows[i].quantity = pa.orderRows[i].quantity - gnote.quantity;
                                                pa.goodsOutNotes.push({
                                                    goodsNoteId : result._id,
                                                    quantity : gnote.quantity
                                                });
                                                i = pa.orderRows.length;
                                            }
                                        }

                                        Availability.update({_id: pa._id}, {goodsOutNotes: pa.goodsOutNotes}, {new: true}, function (rer, pa) {
                                            if (err) {
                                                return next(err);
                                            }
                                            wCb(null, pa);
                                        });
                                    }
                                ], function (err, pa) {
                                    if (err) {
                                        return next(err);
                                    }

                                    eachCb2(null, pa);
                                });
                            }, function (err, pa) {
                                if (err) {
                                    return eachCb1(err);
                                }

                                eachCb1(null, pa);
                            });
                        }, function (err, pa) {
                            if (err) {
                                return next(err);
                            } 
                            event.emit('recalculateStatus', req, result.order, next);
                            res.status(200).send({status: result.status});
                        });
                    } 
                });
            }
        });
    }

    function remove(req, res, next, id) {
        var Products = models.get(req.session.lastDb, 'Products', ProductSchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);

        GoodsOutNote.findOneAndRemove({_id: id}, function (err, goodsOutNote) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: product});
        });
    }

    function getAll(req, res, next) {
        var Product = models.get(req.session.lastDb, 'Product', ProductSchema);
        var queryObject = {};
        var query = req.query;
        var projection = query.projection || {};

        if (query && query.canBeSold === 'true') {
            queryObject.canBeSold = true;

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

        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);

        optionsObject.$and.push({_type: 'GoodsOutNote'});

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


        GoodsOutNote.aggregate([{
            $match: {
                archived : {$ne: true}            
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
                name       : 1,
                warehouse  : {$arrayElemAt: ['$warehouse', 0]},
                order      : {$arrayElemAt: ['$order', 0]},
                status     : 1,
                createdBy  : 1,
                date       : 1,
                _type      : 1,
                checkStatus: 1,
                description: 1
            }
        }, {
            $match: {
                'order.orderType': 'goodsPlan'
            }
        }, {
            $project: {
                name       : 1,
                warehouse  : 1,
                order      : 1,
                status     : 1,
                createdBy  : 1,
                date       : 1,
                _type      : 1,
                checkStatus: 1,
                description: 1
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
                _type           : 1,
                date            : 1,
                createdBy       : 1,
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
                _type          : 1,
                createdBy      : 1,
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
                _id         : '$root._id',
                name        : '$root.name',
                order       : '$root.order',
                status      : '$root.status',
                warehouse   : '$root.warehouse',
                workflow    : '$root.workflow',
                customer    : '$root.customer',
                createdBy   : '$root.createdBy',
                date        : '$root.date',
                total       : 1,
                shipped     : '$root.status.shipped',
                printed     : '$root.status.printed',
                picked      : '$root.status.picked',
                packed      : '$root.status.packed',
                description : '$root.description' }
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
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var Product = models.get(req.session.lastDb, 'Products', ProductSchema);
        var Location = models.get(req.session.lastDb, 'locations', locationsSchema);
        var query;

        query = GoodsOutNote.findById(id);

        query
            .populate('createdBy.user')
            .populate('editedBy.user')
            .populate('shippingMethod')
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                result = result.toJSON();
                async.map(result.orderRows, function (orderRow, callback) {

                        OrderRows.findById(orderRow.orderRowId).exec(function (err, result1) {
                            if (err) {
                                return next(err);
                            }
                            orderRow.orderRowId = result1;
                            Product.findById(orderRow.product).exec(function(err, result2){
                                if(err){
                                    return next(err);
                                }

                                orderRow.product = result2;

                                if(orderRow.gnotesDeliver){
                                    async.map(orderRow.gnotesDeliver, function(gnote, callback1){
                                        GoodsInNote.findById(gnote.goodsInNoteId).exec(function(err, result3){
                                            if(err){
                                                return next(err);
                                            }

                                            gnote.goodsInNoteId = result3;

                                            for(var i=0; i<result3.orderRows.length; i++){
                                                if(result3.orderRows[i].product.toString() === orderRow.product._id.toString()){
                                                    gnote.parameters = result3.orderRows[i].parameters;
                                                }
                                            }

                                            Location.findById(gnote.location).exec(function(err, result4){
                                                if(err){
                                                    return next(err);
                                                }

                                                gnote.location = result4;

                                                callback1(null, gnote);
                                            });

                                        });
                                    }, function(err, gnotes){
                                        if(err){
                                            return callback(err);
                                        }

                                        orderRow.gnotesDeliver = gnotes;

                                        callback(null, orderRow);
                                    });
                                }else{
                                    callback(null, orderRow);
                                }
                            });
                        });
                    }, function (err, orderRows) {
                        if (err) {
                            return next(err);
                        }
                        result.orderRows = orderRows;
                        Order.findById(result.order)
                            .exec(function (err, order) {
                                if (err) {
                                    return next(err);
                                };
                                result.order = order;
                                res.status(200).send(result);
                        });
                });
            });
    }

    this.create = function (req, res, next) {
        var dbName = req.session.lastDb;
        var GoodsOutNote = models.get(dbName, 'GoodsOutNote', GoodsOutSchema);
        var body = req.body;
        var user = req.session.uId;
        var date = new Date();
        var orderId = body.order;

        body.createdBy = {
            user: user
        };

        body.dbName = dbName;

        goodsOutNotesService.create(body, function (err, result) {
            if (err) {
                return wCb(err);
            }
            res.status(200).send(result);
        });

    };

    function bulkRemove(options, res, next) {
        var GoodsOutNote = models.get(options.dbName, 'GoodsOutNote', GoodsOutSchema);
        var ids = options.ids || [];
        var req = options.req;

        async.each(ids, function (id, cb) {
            GoodsOutNote.findById(id).populate('order').exec(function (err, goodsNote) {
                var options;

                if (err) {
                    return cb(err);
                }

                if (goodsNote && goodsNote.order) {
                    async.each(goodsNote.orderRows, function (goodsOrderRow, callback) {

                        var query = goodsNote.order.project ? {
                                product  : goodsOrderRow.product,
                                warehouse: goodsNote.warehouse
                            } : {
                                'goodsOutNotes.goodsNoteId': goodsNote._id,
                                product                    : goodsOrderRow.product,
                                warehouse                  : goodsNote.warehouse
                            };

                        AvailabilityService.updateByQuery({
                            dbName: req.session.lastDb,
                            query : query,

                            body: {
                                $inc: {
                                    onHand: goodsOrderRow.quantity
                                },

                                $pull: {
                                    goodsOutNotes: {goodsNoteId: goodsNote._id}
                                }
                            }
                        }, function (err) {
                            if (err) {
                                return callback(err);
                            }

                            options = {
                                dbName: req.session.lastDb,
                                query : {
                                    'sourceDocument.model': 'goodsOutNote',
                                    'sourceDocument._id'  : id
                                }
                            };

                            JournalEntryService.remove(options);

                            callback();
                        });
                    }, function (err) {
                        if (err) {
                            return cb(err);
                        }

                        event.emit('recalculateStatus', req, goodsNote.order, next);

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

            GoodsOutNote.remove({_id: {$in: ids}}, function (err, result) {
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

    this.getAll = function (req, res, next) {
        getAll(req, res, next);
    };

    this.updateOnlySelectedFields = function (req, res, next) {
        updateOnlySelectedFields(req, res, next);
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

    this.sendEmail = function (req, res, next) {
        var data = req.body;
        var attachments = [];
        var mailOptions;

        if (data.attachment) {
            attachments.push(data.attachment);
        }

        mailOptions = {
            to         : data.To,
            cc         : data.Cc,
            subject    : 'Goods Note ' + data.name,
            attachments: attachments,
            req        : req
        };

        getFromMail(mailOptions, function (err, result) {
            var path = data.attachment ? data.attachment.path : '';

            if (err) {
                return next(err);
            }

            if (path) {
                fs.unlink(path, function (err) {
                    console.log(err);
                });
            }
            res.status(200).send({});
        });
    };

    this.getCurrentGoodsOutNote = function (req, res, next) {
        var retObj = {};
        var lastDb = req.session.lastDb || 'saas';
        var GoodsOutNote = models.get(lastDb, 'GoodsOutNote', GoodsOutSchema);
        var now = new Date();
        var timeId = now.getFullYear()*10000 + now.getMonth()*100 + now.getDate() + 100;  

        GoodsOutNote.aggregate([
            {
                $match:{
                    date: {$ne: null},
                    _type: 'GoodsOutNote'
                }
            },
            {
                $lookup:{
                    from        : 'Order',
                    localField  : 'order',
                    foreignField: '_id',
                    as          : 'order'
                }
            },
            {
                $project: {
                    date: 1,
                    name: 1,
                    order: {$arrayElemAt: ['$order', 0]}
                }
            },
            {
                $project: {
                    timeId: {$add: [{$multiply: [{$year: '$date'}, 10000]}, {$multiply: [{$month: '$date'}, 100]}, {$dayOfMonth: '$date'}]},
                    name: 1,
                    order: 1
                }
            },
            {
                $match: {
                    timeId: timeId,
                    'order.orderType': 'salesOrder'
                }
            },
            {
                $project: {
                    timeId: 1,
                    name: 1
                }
            }
            ],function(err, result){
                if(err){
                    return next(err);
                }
                if(result.length == 0){
                    retObj.retStatus='Fail';
                    retObj.retError='今日没有发货计划';
                    res.status(200).send(retObj);
                }
                else{
                    retObj.retStatus='OK';
                    retObj.retValue=result;
                    res.status(200).send(retObj);
                }
        })
    };

    this.getByProject = function (req, res, next) {
        var retObj = {};
        var lastDb = req.session.lastDb || 'saas';
        var GoodsOutNote = models.get(lastDb, 'GoodsOutNote', GoodsOutSchema);
        var salesOrder = models.get(lastDb, 'Order', OrderSchema);
        var building = req.query.building || req.params.building;

        salesOrder.findOne({building: building, orderType: 'salesOrder'}, function(err, order){
            if(err){
                return next(err)
            }

            if(order === null){
                retObj.retStatus = 'Fail';
                retObj.retError = '该工程没有销售订单';
                res.status(200).send(retObj);
            }else{
                GoodsOutNote.find({order: order._id}, function(err, goodsOutNotes){
                    if(err){
                        return next(err)
                    }

                    if(goodsOutNotes.length == 0){
                        retObj.retStatus = 'Fail';
                        retObj.retError = '该工程没有发货计划';
                        res.status(200).send(retObj);
                    }else{
                        retObj.retStatus = 'OK';
                        retObj.retValue = goodsOutNotes;
                        res.status(200).send(retObj);
                    }
                })
            }
        });

    };

    this.getBarCodesByName = function (req, res, next) {
        var retObj = {};
        var barCodes = [];
        var lastDb = req.session.lastDb || 'saas';
        var GoodsOutNote = models.get(lastDb, 'GoodsOutNote', GoodsOutSchema);
        var BarCode = models.get(lastDb, 'barCode', BarCodeSchema);
        var WriteOffs = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var url = req.query.url || req.params.url;
        var tempUrl = url[3];

        WriteOffs.findOne({_id: tempUrl}, function(err, writeOffs){
            if(err){
                return next(err)
            }

            if(writeOffs){

                GoodsOutNote.findOne({_id: writeOffs.deliverNumber}, function(err, goodsOutNote){
                    if(err){
                        return next(err)
                    }

                    if(goodsOutNote === null){
                        retObj.retStatus = 'Fail';
                        retObj.retError = '暂无该发货计划';
                        res.status(200).send(retObj);
                    }else{
                        async.each(goodsOutNote.orderRows, function (orderRow, eachCb1) {
                            async.each(orderRow.barCodes, function (barCodeId, eachCb2) {                               
                                BarCode.findById(barCodeId)
                                    .exec(function (err, barCode) {
                                        if (err) {
                                            eachCb2(err);
                                        }

                                        barCodes.push(barCode);

                                        eachCb2(null);
                                    });
                            }, function (err) {
                                if (err) {
                                    return eachCb1(err);
                                }

                                eachCb1(null);
                            });
                        }, function (err) {
                            if (err) {
                                return next(err);
                            }

                            if(barCodes.length == 0){
                                retObj.retStatus = 'Fail';
                                retObj.retError = '该发货计划没有找到对应发货条码';
                                res.status(200).send(retObj);
                            }else{
                                retObj.retStatus = 'OK';
                                retObj.retValue = barCodes;
                                res.status(200).send(retObj);
                            }
                        });
                    }
                })

            }
            else{
                retObj.retStatus = 'Fail';
                retObj.retError = '暂无该申请';
                res.status(200).send(retObj);
            }

        })

    };
};

module.exports = GoodsOutNotes;
