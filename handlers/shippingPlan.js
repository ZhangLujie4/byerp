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
    var shippingNoteSchema = mongoose.Schemas.shippingNote;
    var writeOffsSchema = mongoose.Schemas.WriteOffs;
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
        var BarCode = models.get(req.session.lastDb, 'barCode', BarCodeSchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var Order = models.get(req.session.lastDb, 'order', OrderSchema);
        var data = req.body;
        var id = req.params.id;
        var dbName = req.session.lastDb;
        var user = req.session.uId;
        var orderRows = data.orderRows || [];
        function updateGoodsOutNote(cb){
            GoodsOutNote.findById(id, function(err, result){
                if(err){
                    cb(err)
                }
                var preOrderRows = result.orderRows;
                delete data.orderRows;
                if(orderRows.length){
                    for(var i=0; i<orderRows.length; i++){
                        var flag = false;
                        for(var j=0; j<preOrderRows.length; j++){
                            if(preOrderRows[j].orderRowId.toString() == orderRows[i].orderRowId.toString()){
                                preOrderRows[j].barCodes = preOrderRows[j].barCodes.concat(orderRows[i].barCodes);
                                preOrderRows[j].quantity += orderRows[i].quantity;
                                flag = true;
                            }
                        }
                        if(!flag){
                            preOrderRows.push(orderRows[i]);
                        }
                    }
                    data.orderRows = preOrderRows;
                }
                
                GoodsOutNote.findByIdAndUpdate(id, data, {new: true}).exec(function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null,result)
                });
            })
        }

        function updateBarCode(cb){
            async.each(orderRows, function(orderRow, asyncCb){
                async.each(orderRow.barCodes, function(barCode, subCb){
                    BarCode.findByIdAndUpdate(barCode, {$set: {status: 'Progress', goodsOutNote: id}}, function(err, result){
                        if(err){
                            subCb(err)
                        }
                        subCb();
                    })
                }, function(err){
                    if(err){
                        asyncCb(err)
                    }
                    asyncCb();
                })
            }, function(err){
                if(err){
                    cb(err)
                }
                cb(null, null);
            })
        }

        async.parallel([updateGoodsOutNote, updateBarCode], function(err, result){
            if(err){
                next(err)
            }
            res.status(200).send(result[0]);
        })
        
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
        var contentType = query.contentType || 'goodsOutNotes';
        var startDate = query.filter.startDate.value;
        var endDate = query.filter.endDate.value;

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
            delete query.filter.startDate;
            delete query.filter.endDate;
            optionsObject.$and.push(filterMapper.mapFilter(query.filter, contentType)); // caseFilter(query.filter);
        }

        var startKey = new Date(startDate);
        var endKey = new Date(endDate);
        startKey = startKey.getFullYear()*10000 + (startKey.getMonth()+ 1)*100 + startKey.getDate();
        endKey = endKey.getFullYear()*10000 + (endKey.getMonth()+ 1)*100 + endKey.getDate();

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
                load       : 1,
                unLoad     : 1,
                orderRows  : 1,
                dateKey: {$add: [{$multiply: [{$year: '$date'}, 10000]}, {$multiply: [{$month: '$date'}, 100]}, {$dayOfMonth: '$date'}]},
                description: 1
            }
        }, 
        {
            $match: {
                dateKey: {
                    $lte: endKey,
                    $gte: startKey
                }
            }
        },
        {
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
        },{
            $lookup: {
                from        : 'building',
                localField  : 'order.building',
                foreignField: '_id',
                as          : 'order.building'
            }
        },
        {
            $project: {
                name            : 1,
                'order._id'     : 1,
                'order.name'    : 1,
                'order.project' : 1,
                'order.building': {$arrayElemAt: ['$order.building', 0]},
                'order.orderType': 1,
                status          : 1,
                'warehouse._id' : '$warehouse._id',
                'warehouse.name': '$warehouse.name',
                workflow        : {$arrayElemAt: ['$workflow', 0]},
                customer        : {$arrayElemAt: ['$customer', 0]},
                _type           : 1,
                date            : 1,
                createdBy       : 1,
                load            : 1,
                unLoad          : 1,
                sum             : {$sum: '$orderRows.quantity'},
                description     : 1
            }
        },
        {
            $match: {
                'order.orderType': 'salesOrder'
            }
        },
        {
            $project: {
                name           : 1,
                'order._id'    : 1,
                'order.name'   : 1,
                'order.project': 1,
                projectName    : '$order.building.name',
                status         : 1,
                warehouse      : 1,
                date           : 1,
                'workflow._id' : 1,
                'workflow.name': 1,
                'customer._id' : 1,
                'customer.name': {$concat: ['$customer.name.first', ' ', '$customer.name.last']},
                _type          : 1,
                createdBy      : 1,
                load           : 1,
                unLoad         : 1,
                sum            : 1,
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
                customer    : '$root .customer',
                createdBy   : '$root.createdBy',
                date        : '$root.date',
                total       : 1,
                shipped     : '$root.status.shipped',
                printed     : '$root.status.printed',
                picked      : '$root.status.picked',
                packed      : '$root.status.packed',
                projectName : '$root.projectName',
                load        : '$root.load',
                unLoad      : '$root.unLoad',
                sum         : '$root.sum',
                description : '$root.description'
            }
        }, 
        {
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
        var ShippingNote = models.get(dbName, 'shippingNote', shippingNoteSchema);
        var AluveneerOrdersHandler = require('./aluveneerOrders');
        var BarCode = models.get(dbName, 'barCode', BarCodeSchema);
        var aluveneerOrder = new AluveneerOrdersHandler(models);
        var body = req.body;
        var user = req.session.uId;
        var date = new Date();
        var orderId = body.order;

        body.createdBy = {
            user: user
        };

        body.dbName = dbName;
        function createData(callback){
            goodsOutNotesService.create(body, function (err, result) {
                if (err) {
                    callback(err);
                }
                callback(null, result);
            });
        }
        
        function updateBarCode(goodsOutNote, callback){
            var goodsOutNoteId = goodsOutNote._id;
            var orderRows = body.orderRows || [];
            async.each(body.orderRows, function(orderRow, asyncCb){
                var barCodes = orderRow.barCodes || [];
                async.each(barCodes, function(barCode, asyncCb2){
                    BarCode.findByIdAndUpdate(barCode, {$set:{status:'Progress', goodsOutNote: goodsOutNoteId}}, function(err, result){
                        if(err){
                            asyncCb2(err)
                        }
                        asyncCb2(null);
                    })
                }, function(err){
                    if(err){
                        asyncCb(err)
                    }
                    asyncCb(null);
                })
            }, function(err){
                if(err){
                    callback(err)
                }
                callback(null, 'OK');
            })
        }

        async.waterfall([createData, updateBarCode], function(err, result){
            if(err){
                next(err)
            }
            var response = {status: "OK"};
            res.status(200).send(response);
        })
    };

    function bulkRemove(options, res, next) {
        var GoodsOutNote = models.get(options.dbName, 'GoodsOutNote', GoodsOutSchema);
        var BarCode = models.get(options.dbName, 'barCode', BarCodeSchema);
        var ids = options.ids || [];
        var req = options.req;

        async.each(ids, function (id, cb) {
            GoodsOutNote.findById(id).populate('order').exec(function (err, goodsNote) {
                if (err) {
                    return cb(err);
                }
                async.each(goodsNote.orderRows, function(orderRow, asyncCb){
                    async.each(orderRow.barCodes, function(barCode, subcb){
                        BarCode.findByIdAndUpdate(barCode, {$set: {status: 'New', goodsOutNote: null}}, function(err, result){
                            if(err){
                                subcb(err)
                            }
                            subcb();
                        })
                    }, function(err){
                        if(err){
                            asyncCb(err)
                        }
                        asyncCb();
                    })
                }, function(err){
                    if(err){
                        cb(err)
                    }
                    cb();
                })
                
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
        var ShippingNote = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);
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

                    if(goodsOutNotes === null){
                        retObj.retStatus = 'Fail';
                        retObj.retError = '该工程没有发货计划';
                        res.status(200).send(retObj);
                    }else{
                        var ids = [];
                        for(var i=0; i<goodsOutNotes.length; i++){
                            ids.push(goodsOutNotes[i]._id);
                        }
                        ShippingNote.find({goodsOutNote: {$in: ids}, status:'Done', isReturn: false}, function(err, shippingNotes){
                            if(err){
                                return next(err)
                            }

                            if(shippingNotes.length == 0){
                                retObj.retStatus = 'Fail';
                                retObj.retError = '该工程没有发货单';
                                res.status(200).send(retObj);
                            }else{
                                retObj.retStatus = 'OK';
                                retObj.retValue = shippingNotes;
                                res.status(200).send(retObj);
                            }
                        })
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
        var ShippingNote = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);
        var url = req.query.url || req.params.url;
        var tempUrl = url[3];

        WriteOffs.findOne({_id: tempUrl}, function(err, writeOffs){
            if(err){
                return next(err)
            }

            if(writeOffs){

                ShippingNote.findOne({_id: writeOffs.deliverNumber}, function(err, shippingNote){
                    if(err){
                        return next(err)
                    }

                    if(shippingNote === null){
                        retObj.retStatus = 'Fail';
                        retObj.retError = '暂无该发货单';
                        res.status(200).send(retObj);
                    }else{
                        async.eachSeries(shippingNote.barCodes, function (barCodeId, eachCb) {                               
                            BarCode.findById(barCodeId)
                                .exec(function (err, barCode) {
                                    if (err) {
                                        eachCb(err);
                                    }

                                    barCodes.push(barCode);

                                    eachCb(null);
                            });
                            
                        }, function (err) {
                            if (err) {
                                return next(err);
                            }

                            if(barCodes.length == 0){
                                retObj.retStatus = 'Fail';
                                retObj.retError = '该发货单没有找到对应发货条码';
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

    this.getBarCodesByGoodNote = function (req, res, next) {
        var retObj = {};
        var barCodes = [];
        var lastDb = req.session.lastDb || 'saas';
        var GoodsOutNote = models.get(lastDb, 'GoodsOutNote', GoodsOutSchema);
        var BarCode = models.get(lastDb, 'barCode', BarCodeSchema);
        var ShippingNote = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);
        var id = req.query.id || req.params.id;

        ShippingNote.findOne({_id: id}, function(err, shippingNote){
            if(err){
                return next(err)
            }

            if(shippingNote === null){
                retObj.retStatus = 'Fail';
                retObj.retError = '暂无该发货单';
                res.status(200).send(retObj);
            }else{
                async.each(shippingNote.barCodes, function (barCodeId, eachCb) {
                    BarCode.findById(barCodeId)
                        .exec(function (err, barCode) {
                            if (err) {
                                eachCb(err);
                            }

                            barCodes.push(barCode);

                            eachCb(null);
                        });

                }, function (err) {
                    if (err) {
                        return next(err);
                    }

                    if(barCodes.length == 0){
                        retObj.retStatus = 'Fail';
                        retObj.retError = '该发货单没有找到对应发货条码';
                        res.status(200).send(retObj);
                    }else{
                        retObj.retStatus = 'OK';
                        retObj.retValue = barCodes;
                        res.status(200).send(retObj);
                    }
                });
            }
        })

    };

    this.getOrderId = function (req, res, next){
        var lastDb = req.session.lastDb;
        var order = models.get(lastDb, 'Order', OrderSchema);
        var data = req.query;
        var customer = data.customer;
        var projectId = data.projectId;
        var cgdh = data.cgdh.toString();
        order.findOne({building: projectId, externalId: cgdh, orderType: 'salesOrder'}, function(err, result){
            if(err){
                next(err);
            }
            res.status(200).send(result);
        })
    };

    this.confirm = function (req, res, next){
        var lastDb = req.session.lastDb;
        var body = req.body;
        var user = req.session.uId;
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var data = {
            status: {
                approved: true,
                approvedOn: new Date(),
                approvedById: user
            }
        }
        GoodsOutNote.findByIdAndUpdate(body.id, data, {new: true}, function(err, result){
            if(err){
                next(err)
            }
            res.status(200).send(result);
        })
    }
};

module.exports = GoodsOutNotes;
