var mongoose = require('mongoose');

var Module = function (models, event) {
    'use strict';

    var DepartmentSchema = mongoose.Schemas.Department;
    var purchaseOrdersSchema = mongoose.Schemas.purchaseOrders;
    var JobsSchema = mongoose.Schemas.jobs;
    var wTrackSchema = mongoose.Schemas.wTrack;
    var objectId = mongoose.Types.ObjectId;
    var InvoiceSchema = mongoose.Schemas.Invoices;
    var QuotationSchema = mongoose.Schemas.QuotationSchema;
    var WorkflowSchema = mongoose.Schemas.workflow;
    var rewriteAccess = require('../helpers/rewriteAccess');
    var accessRoll = require('../helpers/accessRollHelper.js')(models);
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();
    var RESPONSES = require('../constants/responses');
    var async = require('async');
    var mapObject = require('../helpers/bodyMaper');
    var _ = require('../node_modules/underscore');
    //var ratesService = require('../services/rates')(models);
    var goodsOutNotesService = require('../services/goodsOutNotes')(models);
    var goodsInNotesService = require('../services/goodsInNotes')(models);
    var OrderSchema = mongoose.Schemas.Order;
    var GoodsOutSchema = mongoose.Schemas.GoodsOutNote;
    var GoodsInSchema = mongoose.Schemas.GoodsInNote;
    var OrderRowsSchema = mongoose.Schemas.OrderRow;
    var ProjectSchema = mongoose.Schemas.Project;
    var ProductSchema = mongoose.Schemas.Products;
    var PrepaymentSchema = mongoose.Schemas.Prepayment;
    var AvailabilitySchema = mongoose.Schemas.productsAvailability;
    var CurrencySchema = mongoose.Schemas.Currency;
    var crawlerResultsSchema = mongoose.Schemas.crawlerResults;
    var marketSettingsSchema = mongoose.Schemas.marketSettings;
    var QuotationContractSchema = mongoose.Schemas.purchaseContract;
    var HistoryService = require('../services/history.js')(models);
    var StockReturnsService = require('../services/stockReturns.js')(models);
    var path = require('path');
    var CONSTANTS = require('../constants/mainConstants.js');
    var pageHelper = require('../helpers/pageHelper');
    var moment = require('../public/js/libs/moment/moment');
    //var ratesRetriever = require('../helpers/ratesRetriever')();
    var FilterMapper = require('../helpers/filterMapper');
    var filterMapper = new FilterMapper();
    var GoodsOutNote = require('./goodsOutNote');
    var goodsOutNote = new GoodsOutNote(models, event);
    var GoodsInNotes = require('./goodsInNote');
    var goodsInNotes = new GoodsInNotes(models, event);
    var fs = require('fs');
    var orderCT = 'order';
    var purchaseOrderCT = 'purchaseOrders';
    var xlsx = require('node-xlsx');
    var barCodeSchema = mongoose.Schemas.barCode;

    function updateOnlySelectedFields(req, res, next, id, data) {
        var dbName = req.session.lastDb;
        var Order = models.get(dbName, 'Order', OrderSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);

        var orderRows;
        var fileName;
        var os;
        var _id;
        var osType;
        var path;
        var dir;
        var newDirname;
        var obj;
        var deletedOrderRows;

        if (data.orderRows) {
            orderRows = data.orderRows;
            delete data.orderRows;
        }

        if (data.deletedProducts) {
            deletedOrderRows = data.deletedProducts;
            delete data.deletedProducts;
        }

        if (data.notes && data.notes.length !== 0) {
            obj = data.notes[data.notes.length - 1];

            if (!obj._id) {
                obj._id = mongoose.Types.ObjectId();
            }

            if (!obj.user) {
                obj.user = {};
                obj.user._id = req.session.uId;
                obj.user.login = req.session.uName;
            }

            data.notes[data.notes.length - 1] = obj;
        }

        if (deletedOrderRows) {
            async.each(deletedOrderRows, function (orderRowId, cb) {
                OrderRows.findByIdAndRemove(orderRowId, function (err) {
                    if (err) {
                        return cb(err);
                    }

                    cb();
                });
            }, function (err) {
                if (err) {
                    return next(err);
                }

                updateOrderRows();
            });
        } else {
            updateOrderRows();
        }

        function updateOrderRows() {
            if (data.fileName) {

                fileName = data.fileName;
                os = require('os');
                osType = (os.type().split('_')[0]);

                _id = id;

                switch (osType) {
                    case 'Windows':
                        newDirname = __dirname.replace('handlers', 'routes');

                        while (newDirname.indexOf('\\') !== -1) {
                            newDirname = newDirname.replace('\\', '\/');
                        }
                        path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                        dir = newDirname + '\/uploads\/' + _id;
                        break;
                    case 'Linux':
                        newDirname = __dirname.replace('handlers', 'routes');

                        while (newDirname.indexOf('\\') !== -1) {
                            newDirname = newDirname.replace('\\', '\/');
                        }
                        path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                        dir = newDirname + '\/uploads\/' + _id;
                        break;
                    //skip default;
                }

                fs.unlink(path, function (err) {
                    fs.readdir(dir, function () {
                        if (data.attachments && data.attachments.length === 0) {
                            fs.rmdir(dir, function () {
                            });
                        }
                    });
                });

                delete data.fileName;

                Order.findByIdAndUpdate(id, {$set: data}, {new: true}, function (err, oredr) {
                    if (err) {
                        return next(err);
                    }

                    getById(req, res, next);
                });

            } else {
                Order.findByIdAndUpdate(id, {$set: data}, {new: true}, function (err, order) {
                    var historyOptions;

                    if (err) {
                        return next(err);
                    }

                    historyOptions = {
                        contentType: 'order',
                        data       : data,
                        dbName     : dbName,
                        contentId  : id
                    };

                    HistoryService.addEntry(historyOptions, function () {
                        if (orderRows) {
                            async.each(orderRows, function (orderRow, cb) {
                                var id = orderRow.id;
                                var row;

                                if (!id) {
                                    orderRow.order = order._id;
                                    row = new OrderRows(orderRow);
                                    row.save(function (err, elem) {
                                        if (err) {
                                            return cb(err);
                                        }
                                        cb();
                                    });
                                } else {
                                    delete orderRow.id;
                                    OrderRows.findByIdAndUpdate(id, orderRow, {new: true}, function (err, doc) {
                                        if (err) {
                                            return cb(err);
                                        }
                                        cb();
                                    });
                                }

                            }, function (err) {
                                if (err) {
                                    return next(err);
                                }

                                event.emit('recalculateStatus', req, order._id, next);

                                getById(req, res, next);
                            });

                        } else {
                            getById(req, res, next);
                        }
                    });
                });
            }
        }
    }

    function getHistory(req, order, cb) {
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);

        var historyOptions = {
            forNote: true,
            dbName : req.session.lastDb,
            id     : order._id
        };

        HistoryService.getHistoryForTrackedObject(historyOptions, function (err, history) {
            var notes;

            if (err) {
                return cb(err);
            }

            notes = history.map(function (elem) {
                return {
                    date   : elem.date,
                    history: elem,
                    user   : elem.editedBy
                };
            });

            if (!order.notes) {
                order.notes = [];
            }
            order.notes = order.notes.map(function(elem){
                return {
                    _id  : elem._id,
                    date : new Date(elem.date),
                    user : elem.user,
                    note : elem.note
                };
            });
            order.notes = order.notes.concat(notes);
            order.notes = _.sortBy(order.notes, 'date');
            cb(null, order);

        }, true);

    }

    this.create = function (req, res, next) {
        var db = req.session.lastDb;
        var Order = models.get(db, 'Order', OrderSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var JobsModel = models.get(req.session.lastDb, 'jobs', JobsSchema);
        var body = mapObject(req.body);
        var order;
        var mid = parseInt(req.headers.mid, 10) || 129;
        var arrayRows = body.products;
        var rates;
        var currency = body.currency;
        var base;
        
        if (mid === 129) {
            Order = models.get(db, 'purchaseOrders', purchaseOrdersSchema);
        }

        // currencyHalper(body.orderDate, function (err, oxr) {

        // ratesService.getById({dbName: db, id: body.orderDate}, function (err, ratesObject) {
            // rates = ratesObject ? ratesObject.rates : {};
            // base = ratesObject ? ratesObject.base : 'USD';

            body.currency = body.currency || {};
            // body.currency.rate = ratesRetriever.getRate(rates, base, currency.name);
            body.currency.rate = 1;

            order = new Order(body);

            if (req.session.uId) {
                order.createdBy.user = req.session.uId;
                order.editedBy.user = req.session.uId;
            }

            order.save(function (err, _order) {
                var historyOptions;
                var arr;
                if (err) {
                    return next(err);
                }

                historyOptions = {
                    contentType: 'order',
                    data       : _order.toJSON(),
                    dbName     : db,
                    contentId  : _order._id
                };
                HistoryService.addEntry(historyOptions, function () {
                });

                arr = arrayRows.map(function (elem) {
                    elem._id = objectId();
                    elem.product = objectId(elem.product);
                    elem.warehouse = objectId(elem.warehouse);
                    elem.debitAccount = elem.debitAccount ? objectId(elem.debitAccount) : null;
                    elem.creditAccount = elem.creditAccount ? objectId(elem.creditAccount) : null;
                    elem.order = _order._id;
                    elem.quantity = parseInt(elem.quantity, 10);

                    return elem;
                });

                OrderRows.collection.insertMany(arr, function (err, docs) {
                    var insertedIds;

                    if (err) {
                        return next(err);
                    }

                    insertedIds = docs.insertedIds;

                    OrderRows.aggregate([{
                        $match: {_id: {$in: insertedIds}}
                    }, {
                        $lookup: {
                            from        : 'Products',
                            localField  : 'product',
                            foreignField: '_id',
                            as          : 'product'
                        }
                    }, {
                        $project: {
                            product: {$arrayElemAt: ['$product', 0]}
                        }
                    }, {
                        $group: {
                            _id : null,
                            jobs: {$addToSet: '$product.job'}
                        }
                    }], function (err, result) {
                        var jobIds;
                        var body;

                        if (err) {
                            return next(err);
                        }

                        body = {
                            order: _order._id,
                            type : 'Ordered'
                        };

                        jobIds = result && result.length ? result[0].jobs : [];

                        JobsModel.update({_id: {$in: jobIds}}, {$set: body}, {multi: true}, function (rer, result) {
                            if (err) {
                                return next(err);
                            }

                            res.status(201).send(_order);
                        });
                    });

                });

            });
        // });
    };

    this.putchModel = function (req, res, next) {
        var db = req.session.lastDb;
        var id = req.params.id;
        var data = mapObject(req.body);
        var mid = parseInt(req.headers.mid, 10);
        var waterfallTasks;
        var getGoodsOutNotes;
        var updateFields;
        var removeGoods;

        data.editedBy = {
            user: req.session.uId,
            date: new Date().toISOString()
        };
        data.currency = data.currency || {};

        if (data.cancel && data.forSales) {
            getGoodsOutNotes = function (callback) {
                goodsOutNotesService.getByOrder({dbName: db, order: objectId(id)}, callback);
            };

            removeGoods = function (ids, callback) {
                var options = {
                    ids   : ids,
                    dbName: db,
                    req   : req
                };
                goodsOutNote.removeByOrder(options, callback);
            };

            updateFields = function (callback) {
                callback();
                updateOnlySelectedFields(req, res, next, id, data);
            };

            waterfallTasks = [getGoodsOutNotes, removeGoods, updateFields];
            async.waterfall(waterfallTasks, function () {

            });

            return false;
        }

        if (data.cancel) {
            getGoodsOutNotes = function (callback) {
                goodsInNotesService.getByOrder({dbName: db, order: objectId(id)}, callback);
            };

            removeGoods = function (ids, callback) {
                var options = {
                    ids   : ids,
                    dbName: db,
                    req   : req
                };
                goodsInNotes.removeByOrder(options, function (err) {
                    if (err && err.status !== 400) {
                        return next(err);
                    } else if (err && err.status === 400) {
                        res.status(400).send({error: err.message});
                    }

                    callback();
                });
            };

            updateFields = function (callback) {
                callback();
                updateOnlySelectedFields(req, res, next, id, data);
            };

            waterfallTasks = [getGoodsOutNotes, removeGoods, updateFields];
            async.waterfall(waterfallTasks, function () {

            });

            return false;
        }

        // if (data.orderDate) {
        //     ratesService.getById({dbName: db, id: data.orderDate}, function (err, oxr) {
        //         var currency = data.currency ? data.currency.name : 'USD';
        //         var rates;
        //         var base;

        //         oxr = oxr || {};
        //         rates = oxr.rates || {};
        //         base = oxr.base || 'USD';
        //         data.currency.rate = ratesRetriever.getRate(rates, base, currency);
        //         updateOnlySelectedFields(req, res, next, id, data);
        //     });
        // } else {
        updateOnlySelectedFields(req, res, next, id, data);

        // }
    };

    this.updateModel = function (req, res, next) {
        var db = req.session.lastDb;
        var id = req.params.id;
        var data = mapObject(req.body);
        var waterfallTasks;
        var getGoodsOutNotes;
        var updateFields;
        var removeGoods;

        data.editedBy = {
            user: req.session.uId,
            date: new Date().toISOString()
        };
        data.currency = data.currency || {};

        if (data.cancel && data.forSales) {

            getGoodsOutNotes = function (callback) {
                goodsOutNotesService.getByOrder({dbName: db, order: objectId(id)}, callback);
            };

            removeGoods = function (ids, callback) {
                var options = {
                    ids   : ids,
                    dbName: db,
                    req   : req
                };
                goodsOutNote.removeByOrder(options, callback);
            };

            updateFields = function (callback) {
                callback();
                updateOnlySelectedFields(req, res, next, id, data);
            };

            waterfallTasks = [getGoodsOutNotes, removeGoods, updateFields];
            async.waterfall(waterfallTasks, function () {

            });

            return false;
        }

        if (data.orderDate) {
            /**
            ratesService.getById({dbName: db, id: data.orderDate}, function (err, oxr) {
                var currency = data.currency ? data.currency.name : 'USD';
                var rates;
                var base;

                oxr = oxr || {};
                rates = oxr.rates;
                base = oxr.base || 'USD';
                data.currency.rate = rates[currency][base] || 1;

                updateOnlySelectedFields(req, res, next, id, data);
            }); **/
        } else {
            updateOnlySelectedFields(req, res, next, id, data);

        }
    };


    this.uploadFile = function (req, res, next) {
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var headers = req.headers;
        var addNote = headers.addnote;
        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'order';
        var files = req.files && req.files.attachfile ? req.files.attachfile : null;
        var dir;
        var err;

        contentType = contentType.toLowerCase();
        dir = path.join(contentType, id);

        if (!files) {
            err = new Error(RESPONSES.BAD_REQUEST);
            err.status = 400;

            return next(err);
        }

        uploader.postFile(dir, files, {userId: req.session.uName}, function (err, file) {
            var notes = [];
            if (err) {
                return next(err);
            }

            if (addNote) {
                notes = file.map(function (elem) {
                    return {
                        _id       : mongoose.Types.ObjectId(),
                        attachment: {
                            name    : elem.name,
                            shortPas: elem.shortPas
                        },

                        user: {
                            _id  : req.session.uId,
                            login: req.session.uName
                        },

                        date: new Date()
                    };
                });
            }

            Order.findByIdAndUpdate(id, {
                $push: {
                    attachments: {$each: file},
                    notes      : {$each: notes}
                }
            }, {new: true}, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({success: 'Order updated success', data: response});
            });
        });
    };
    function getByViewType(req, res, next) {
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var data = req.query;
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var accessRollSearcher;
        var contentSearcher;
        var waterfallTasks;
        var contentType = data.contentType;
        var sort = {};
        var filter = data.filter || {};
        var key;
        var queryObject = {};
        var optionsObject = {};
        var pastDue = filter.pastDue;

        queryObject.$and = [];

        if (filter && typeof filter === 'object') {
             queryObject.$and.push(filterMapper.mapFilter(filter, {contentType: contentType})); // caseFilter(filter);
        }

        if (data.sort) {
            key = Object.keys(data.sort)[0];
            data.sort[key] = parseInt(data.sort[key], 10);
            sort = data.sort;
        } else {
            sort = {orderDate: -1};
        }

        if (contentType !== 'order' && contentType !== 'integrationUnlinkedOrders') {
            Order = models.get(req.session.lastDb, 'purchaseOrders', purchaseOrdersSchema);

            queryObject.$and.push({_type: 'purchaseOrders'});
        } else {
            queryObject.$and.push({_type: 'Order', orderType: 'salesOrder'});
        }

        if (pastDue) {
            optionsObject.$and.push({expectedDate: {$gt: new Date(filter.date.value[1])}}, {'workflow.status': {$ne: 'Done'}});
        }

        accessRollSearcher = function (cb) {
            accessRoll(req, Order, cb);
        };

        contentSearcher = function (ids, cb) {
            var newQueryObj = {};

            var salesManagerMatch = {
                $and: [
                    {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]},
                    {
                        $or: [{
                            $and: [{
                                $eq: ['$$projectMember.startDate', null]
                            }, {
                                $eq: ['$$projectMember.endDate', null]
                            }]
                        }, {
                            $and: [{
                                $lte: ['$$projectMember.startDate', '$orderDate']
                            }, {
                                $eq: ['$$projectMember.endDate', null]
                            }]
                        }, {
                            $and: [{
                                $eq: ['$$projectMember.startDate', null]
                            }, {
                                $gte: ['$$projectMember.endDate', '$orderDate']
                            }]
                        }, {
                            $and: [{
                                $lte: ['$$projectMember.startDate', '$orderDate']
                            }, {
                                $gte: ['$$projectMember.endDate', '$orderDate']
                            }]
                        }]
                    }]
            };

            /*if (queryObject && queryObject.$and && queryObject.$and.length && queryObject.$and[0].name) {
             queryObject.$and[0] = {
             name: queryObject.$and[0].name.$in[0]
             };
             }*/

            newQueryObj.$and = [];
            newQueryObj.$and.push(queryObject);
            newQueryObj.$and.push({_id: {$in: ids}});

            Order.aggregate([{
                $lookup: {
                    from        : 'projectMembers',
                    localField  : 'project',
                    foreignField: 'projectId',
                    as          : 'projectMembers'
                }
            }, {
                $lookup: {
                    from        : 'Payment',
                    localField  : '_id',
                    foreignField: 'order',
                    as          : 'payments'
                }
            }, {
                $lookup: {
                    from        : 'Customers',
                    localField  : 'supplier',
                    foreignField: '_id',
                    as          : 'supplier'
                }
            }, {
                $lookup: {
                    from        : 'workflows',
                    localField  : 'workflow',
                    foreignField: '_id',
                    as          : 'workflow'
                }
            }, {
                $lookup: {
                    from        : 'currency',
                    localField  : 'currency._id',
                    foreignField: '_id',
                    as          : 'currency._id'
                }
            }, {
                $lookup: {
                    from        : 'Project',
                    localField  : 'project',
                    foreignField: '_id',
                    as          : 'project'
                }
            }, {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'salesPerson',
                    foreignField: '_id',
                    as          : 'salesPerson'
                }
            }, {
                $lookup: {
                    from        : 'integrations',
                    localField  : 'channel',
                    foreignField: '_id',
                    as          : 'channel'
                }
            }, {
                $lookup: {
                    from        : 'orderRows',
                    localField  : '_id',
                    foreignField: 'order',
                    as          : 'products'
                }
            }, {
                $project: {
                    workflow       : {$arrayElemAt: ['$workflow', 0]},
                    supplier       : {$arrayElemAt: ['$supplier', 0]},
                    'currency._id' : {$arrayElemAt: ['$currency._id', 0]},
                    payments       : 1,
                    'currency.rate': 1,
                    salesManagers  : {
                        $filter: {
                            input: '$projectMembers',
                            as   : 'projectMember',
                            cond : salesManagerMatch
                        }
                    },

                    channel    : {$arrayElemAt: ['$channel', 0]},
                    salesPerson: {$arrayElemAt: ['$salesPerson', 0]},
                    orderRows  : 1,
                    paymentInfo: 1,
                    orderDate  : 1,
                    name       : 1,
                    status     : 1,
                    _type      : 1,
                    forSales   : 1,
                    products   : 1,
                    orderType  : 1,
                    project    : {$arrayElemAt: ['$project', 0]}
                }
            }, 

            {
                $project: {
                    salesManager: {$arrayElemAt: ['$salesManagers', 0]},
                    supplier    : {
                        _id : '$supplier._id',
                        name: {$concat: ['$supplier.name.first', ' ', '$supplier.name.last']}
                    },

                    workflow: {
                        _id   : '$workflow._id',
                        status: '$workflow.status',
                        name  : '$workflow.name'
                    },

                    channel: {
                        _id : '$channel._id',
                        name: '$channel.channelName',
                        type: '$channel.type'
                    },

                    currency       : 1,
                    paymentInfo    : 1,
                    orderDate      : 1,
                    salesPerson    : 1,
                    name           : 1,
                    isOrder        : 1,
                    proformaCounter: 1,
                    payments       : 1,
                    status         : 1,
                    _type          : 1,
                    forSales       : 1,
                    products       : 1,
                    orderType      : 1,
                    project        : 1
                }
            }, {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'salesManager.employeeId',
                    foreignField: '_id',
                    as          : 'salesManager'
                }
            }, {
                $project: {
                    salesPerson: {$ifNull: ['$salesPerson', {$arrayElemAt: ['$salesManager', 0]}]},
                    workflow   : 1,
                    supplier   : 1,
                    currency   : 1,
                    paymentInfo: 1,
                    orderDate  : 1,
                    payments   : 1,
                    name       : 1,
                    status     : 1,
                    _type      : 1,
                    forSales   : 1,
                    channel    : 1,
                    products   : 1,
                    orderType  : 1,
                    project    : 1
                }
            }, {
                $project: {
                    salesPerson: {
                        _id : '$salesPerson._id',
                        name: {$concat: ['$salesPerson.name.first', ' ', '$salesPerson.name.last']}
                    },
                    workflow   : 1,
                    supplier   : 1,
                    currency   : 1,
                    paymentInfo: 1,
                    orderDate  : 1,
                    name       : 1,
                    status     : 1,
                    _type      : 1,
                    forSales   : 1,
                    channel    : 1,
                    payments   : 1,
                    products   : 1,
                    orderType  : 1,
                    project    : 1,
                    removable  : {
                        $cond: {
                            if  : {$and: [{$ne: ['$workflow.status', 'Done']}, {$ne: ['$status.fulfillStatus', 'ALL']}]},
                            then: true,
                            else: false
                        }
                    }
                }
            }, {
                $match: newQueryObj
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
                    _id        : '$root._id',
                    salesPerson: '$root.salesPerson',
                    workflow   : '$root.workflow',
                    supplier   : '$root.supplier',
                    currency   : '$root.currency',
                    paymentInfo: '$root.paymentInfo',
                    orderDate  : '$root.orderDate',
                    name       : '$root.name',
                    status     : '$root.status',
                    removable  : '$root.removable',
                    channel    : '$root.channel',
                    payments   : '$root.payments',
                    products   : '$root.products',
                    orderType  : '$root.orderType',
                    project    : '$root.project',
                    total      : 1
                }
            }, {
                $unwind: {
                    path                      : '$payments',
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $project: {
                    salesPerson          : 1,
                    workflow             : 1,
                    supplier             : 1,
                    currency             : 1,
                    paymentInfo          : 1,
                    orderDate            : 1,
                    name                 : 1,
                    status               : 1,
                    removable            : 1,
                    channel              : 1,
                    products             : 1,
                    orderType            : 1,
                    project              : 1,
                    total                : 1,
                    'payments.currency'  : 1,
                    'payments.paidAmount': {$cond: [{$eq: ['$payments.refund', true]}, {$multiply: ['$payments.paidAmount', -1]}, '$payments.paidAmount']}
                }
            }, {
                $group: {
                    _id         : '$_id',
                    salesPerson : {$first: '$salesPerson'},
                    workflow    : {$first: '$workflow'},
                    supplier    : {$first: '$supplier'},
                    currency    : {$first: '$currency'},
                    paymentInfo : {$first: '$paymentInfo'},
                    orderDate   : {$first: '$orderDate'},
                    name        : {$first: '$name'},
                    status      : {$first: '$status'},
                    removable   : {$first: '$removable'},
                    channel     : {$first: '$channel'},
                    products    : {$first: '$products'},
                    orderType   : {$first: '$orderType'},
                    project     : {$first: '$project'},
                    paymentsPaid: {$sum: {$divide: ['$payments.paidAmount', '$payments.currency.rate']}},
                    total       : {$first: '$total'}
                }
            }, {
                $sort: sort
            }, {
                $skip: skip
            }, {
                $limit: limit
            }], cb);
        };

        waterfallTasks = [accessRollSearcher, contentSearcher];

        async.waterfall(waterfallTasks, function (err, result) {
            var count;
            var firstElement;
            var response = {};

            if (err) {
                return next(err);
            }

            firstElement = result[0];
            count = firstElement && firstElement.total ? firstElement.total : 0;
            response.total = count;
            response.count = result.length;
            response.data = result;
            res.status(200).send(response);
        });
    }

    function getAvailableForRows(req, docs, forSales, cb) {
        var Availability = forSales ? models.get(req.session.lastDb,'barCode',barCodeSchema) : models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var populateDocs = [];
        var allGoodsNotes = [];

        if (docs && docs.length) {
            async.each(docs, function (elem, eachCb) {
                var product;
                var warehouseId;

                var parallelTasks;

                elem = elem.toJSON();

                product = elem.product ? elem.product._id : null;
                warehouseId = elem.warehouse ? objectId(elem.warehouse._id) : null;

                function getAvailabilities(parallelCb) {

                    if(forSales){
                        Availability.aggregate([{
                            $match: {
                                orderRowId : elem._id
                            }
                        },{
                            $lookup: {
                                from        : 'workCentres',
                                localField  : 'curWorkCentre',
                                foreignField: '_id',
                                as          : 'curWorkCentre'
                            }
                        },{
                            $project: {
                                curWorkCentre : {$arrayElemAt: ['$curWorkCentre', 0]}
                            }
                        }], function (err, availability) {
                            if (err) {
                                return parallelCb(err);
                            }
                            var result = [];
                            result[0] = {
                                allocated : 0,
                                onHand : 0,
                                inStock : 0,
                                onOrder : 0
                            };

                            if(availability.length){
                                result[0].inStock = availability.length;
                                for(var i=0; i<availability.length; i++){
                                    if(availability[i].curWorkCentre.code === "07"){
                                        result[0].onHand++;
                                    }
                                }
                            }

                            parallelCb(null, result);
                        });
                    }else{
                        Availability.aggregate([{
                            $match: {
                                product  : objectId(product),
                                warehouse: warehouseId
                            }
                        }, {
                            $project: {
                                product      : 1,
                                warehouse    : 1,
                                onHand       : 1,
                                filterRows   : {
                                    $filter: {
                                        input: '$orderRows',
                                        as   : 'elem',
                                        cond : {$eq: ['$$elem.orderRowId', objectId(elem._id)]}
                                    }
                                },
                                orderRows    : 1,
                                goodsOutNotes: 1
                            }
                        }, {
                            $project: {
                                product  : 1,
                                warehouse: 1,
                                onHand   : 1,
                                allocated: {
                                    $sum: '$filterRows.quantity'
                                },

                                allocatedAll: {
                                    $sum: '$orderRows.quantity'
                                },

                                fulfillAll: {
                                    $sum: '$goodsOutNotes.quantity'
                                }
                            }
                        }, {
                            $project: {
                                product  : 1,
                                warehouse: 1,
                                onHand   : 1,
                                allocated: 1,
                                inStock  : {
                                    $add: ['$onHand', '$allocatedAll', '$fulfillAll']
                                }
                            }
                        }, {
                            $group: {
                                _id      : '$warehouse',
                                allocated: {
                                    $sum: '$allocated'
                                },

                                onHand: {
                                    $sum: '$onHand'
                                },

                                inStock: {
                                    $sum: '$inStock'
                                },

                                onOrder: {
                                    $sum: '$onOrder'
                                }
                            }
                        }], function (err, availability) {
                            if (err) {
                                return parallelCb(err);
                            }
                            parallelCb(null, availability);
                        });
                    }
                }

                function getNotes(parallelCb) {
                    var Model = forSales ? GoodsOutNote : GoodsInNote;

                    Model.aggregate([{
                        $match: {
                            'orderRows.orderRowId': elem._id,
                            _type                 : forSales ? 'GoodsOutNote' : 'GoodsInNote',
                            archived              : {$ne: true}
                        }
                    }, {
                        $lookup: {
                            from        : 'warehouse',
                            localField  : 'warehouse',
                            foreignField: '_id',
                            as          : 'warehouse'
                        }
                    }, {
                        $lookup: {
                            from        : 'productsAvailability',
                            localField  : '_id',
                            foreignField: 'goodsInNote',
                            as          : 'goodsInNote'
                        }
                    }, {
                        $lookup: {
                            from        : 'Users',
                            localField  : 'status.printedById',
                            foreignField: '_id',
                            as          : 'status.printedById'
                        }
                    }, {
                        $lookup: {
                            from        : 'Users',
                            localField  : 'status.pickedById',
                            foreignField: '_id',
                            as          : 'status.pickedById'
                        }
                    }, {
                        $lookup: {
                            from        : 'Users',
                            localField  : 'status.packedById',
                            foreignField: '_id',
                            as          : 'status.packedById'
                        }
                    }, {
                        $lookup: {
                            from        : 'Users',
                            localField  : 'status.shippedById',
                            foreignField: '_id',
                            as          : 'status.shippedById'
                        }
                    }, {
                        $lookup: {
                            from        : 'Order',
                            localField  : 'order',
                            foreignField: '_id',
                            as          : 'order'
                        }
                    }, {
                        $project: {
                            name    : '$name',
                            orderRow: {
                                $filter: {
                                    input: '$orderRows',
                                    as   : 'elem',
                                    cond : {$eq: ['$$elem.orderRowId', objectId(elem._id)]}
                                }
                            },

                            goodsInNote         : {$arrayElemAt: ['$goodsInNote', 0]},
                            warehouse           : {$arrayElemAt: ['$warehouse', 0]},
                            order               : {$arrayElemAt: ['$order', 0]},
                            'status.printedById': {$arrayElemAt: ['$status.printedById', 0]},
                            'status.pickedById' : {$arrayElemAt: ['$status.pickedById', 0]},
                            'status.packedById' : {$arrayElemAt: ['$status.packedById', 0]},
                            'status.shippedById': {$arrayElemAt: ['$status.shippedById', 0]},
                            'status.printedOn'  : 1,
                            'status.pickedOn'   : 1,
                            'status.packedOn'   : 1,
                            'status.shippedOn'  : 1,
                            'status.receivedOn' : 1,
                            'status.shipped'    : 1,
                            'status.picked'     : 1,
                            'status.packed'     : 1,
                            'status.printed'    : 1
                        }
                    }, {
                        $project: {
                            name                : '$name',
                            orderRow            : {$arrayElemAt: ['$orderRow', 0]},
                            status              : 1,
                            warehouse           : 1,
                            'goodsInNote._id'   : 1,
                            'goodsInNote.onHand': 1,
                            'order.name'        : 1
                        }
                    }, {
                        $project: {
                            name        : '$name',
                            orderRow    : '$orderRow.orderRowId',
                            quantity    : '$orderRow.quantity',
                            status      : 1,
                            warehouse   : 1,
                            goodsInNote : 1,
                            'order.name': 1
                        }
                    }], function (err, docs) {
                        if (err) {
                            return parallelCb(err);
                        }
                        if (docs && docs.length) {
                            docs = docs.map(function (el) {
                                el._id = el._id.toJSON();
                                return el;
                            });
                        }

                        parallelCb(null, docs);
                    });
                }

                parallelTasks = [getNotes, getAvailabilities];

                async.parallel(parallelTasks, function (err, response) {
                    var availability;
                    var goodsNotes;

                    if (err) {
                        return eachCb(err);
                    }

                    availability = response[1];
                    goodsNotes = response[0];
                    allGoodsNotes = allGoodsNotes.concat(goodsNotes);
                    availability = availability && availability.length ? availability[0] : null;

                    if (availability) {
                        elem.inStock = availability.inStock;
                        elem.onHand = availability.onHand;
                        elem.allocated = availability.allocated;
                    }
                    elem.goodsNotes = goodsNotes;
                    elem.fulfilled = 0;

                    if (goodsNotes && goodsNotes.length) {
                        goodsNotes.forEach(function (el) {
                            elem.fulfilled += el.quantity;
                        });
                    }

                    populateDocs.push(elem);
                    eachCb();
                });

            }, function (err) {
                if (err) {
                    return cb(err);
                }

                allGoodsNotes = _.uniq(allGoodsNotes, '_id');

                cb(null, populateDocs, allGoodsNotes);

            });
        } else {
            cb();
        }

    }

    function getById(req, res, next) {
        var id = req.query.id || req.params.id;
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var Prepayments = models.get(req.session.lastDb, 'prepayment', PrepaymentSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var Invoice = models.get(req.session.lastDb, 'Invoices', InvoiceSchema);
        var BarCode = models.get(req.session.lastDb,'barCode',barCodeSchema);
        var departmentSearcher;
        var contentIdsSearcher;
        var orderRowsSearcher;
        var contentSearcher;
        var prepaymentsSearcher;
        var invoiceSearcher;
        var stockReturnsSearcher;
        var waterfallTasks;

        if (id.length < 24) {
            return res.status(400).send();
        }

        /* var contentType = req.query.contentType;
         var isOrder = ((contentType === 'Orders') || (contentType === 'salesOrders'));*/

        departmentSearcher = function (waterfallCallback) {
            models.get(req.session.lastDb, 'Department', DepartmentSchema).aggregate(
                {
                    $match: {
                        users: objectId(req.session.uId)
                    }
                }, {
                    $project: {
                        _id: 1
                    }
                },

                waterfallCallback);
        };

        contentIdsSearcher = function (deps, waterfallCallback) {
            var everyOne = rewriteAccess.everyOne();
            var owner = rewriteAccess.owner(req.session.uId);
            var group = rewriteAccess.group(req.session.uId, deps);
            var whoCanRw = [everyOne, owner, group];
            var matchQuery = {
                $or: whoCanRw
            };

            var Model = models.get(req.session.lastDb, 'Order', OrderSchema);

            Model.aggregate({
                $match: matchQuery
            }, {
                $project: {
                    _id: 1
                }
            }, waterfallCallback);
        };

        contentSearcher = function (quotationsIds, waterfallCallback) {
            var query;

            query = Order.findById(id);

            query
                .populate('supplier', '_id name fullName address')
                .populate('destination')
                // .populate('currency._id')
                .populate('incoterm')
                .populate('priceList', 'name')
                .populate('costList', 'name')
                .populate('warehouse', 'name')
                .populate('salesPerson', 'name')
                .populate('invoiceControl')
                .populate('paymentTerm')
                .populate('paymentMethod', '_id name account bank address swiftCode owner')
                .populate('editedBy.user', '_id login')
                .populate('deliverTo', '_id, name')
                .populate('project', '_id name')
                .populate('shippingMethod', '_id name')
                .populate('workflow', '_id name status')
                .populate('contract', '_id number');
            query.exec(waterfallCallback);
        };

        orderRowsSearcher = function (order, waterfallCallback) {

            OrderRows.find({order: order._id})
                .populate('product', 'cost name sku info')
                .populate('debitAccount', 'name')
                .populate('creditAccount', 'name')
                .populate('taxes.taxCode', 'fullName rate')
                .populate('warehouse', 'name')
                .sort('products')
                .exec(function (err, docs) {
                    if (err) {
                        return waterfallCallback(err);
                    }

                    order = order.toJSON();
                    getAvailableForRows(req, docs, order.forSales, function (err, docs, goodsNotes) {
                        if (err) {
                            return waterfallCallback(err);
                        }

                        order.products = docs;
                        order.account = docs && docs.length ? docs[0].debitAccount : {};

                        if (!order.forSales) {
                            order.account = docs && docs.length ? docs[0].creditAccount : {};
                        }

                        order.goodsNotes = goodsNotes;

                        waterfallCallback(null, order);
                    });
                });
        };

        prepaymentsSearcher = function (order, waterfallCallback) {
            Prepayments.aggregate([{
                $match: {
                    order: objectId(id)
                }
            }, {
                $project: {
                    paidAmount: 1,
                    currency  : 1,
                    date      : 1,
                    name      : 1,
                    refund    : 1
                }
            }, {
                $project: {
                    paidAmount: {$divide: ['$paidAmount', '$currency.rate']},
                    date      : 1,
                    name      : 1,
                    refund    : 1
                }
            }, {
                $project: {
                    paidAmount: {$cond: [{$eq: ['$refund', true]}, {$multiply: ['$paidAmount', -1]}, '$paidAmount']},
                    date      : 1,
                    name      : 1,
                    refund    : 1
                }
            }, {
                $group: {
                    _id  : null,
                    sum  : {$sum: '$paidAmount'},
                    names: {$push: '$name'},
                    date : {$min: '$date'}
                }
            }], function (err, result) {
                if (err) {
                    return waterfallCallback(err);
                }

                order.prepayment = result && result.length ? result[0] : {};

                waterfallCallback(null, order);
            });
        };

        invoiceSearcher = function (order, waterfallCallback) {
            Invoice.aggregate([{
                $match: {
                    sourceDocument: objectId(id)
                }
            }, {
                $project: {
                    name: 1
                }
            }], function (err, result) {
                if (err) {
                    return waterfallCallback(err);
                }

                order.invoice = result && result.length ? result[0] : {};
                waterfallCallback(null, order);
            });
        };

        stockReturnsSearcher = function (order, waterfallCallback) {
            StockReturnsService.findForOrder({
                query : {order: objectId(order._id)},
                dbName: req.session.lastDb
            }, function (err, docs) {
                if (err) {
                    return waterfallCallback(err);
                }

                order.stockReturns = docs || [];

                waterfallCallback(null, order);
            })
        };

        waterfallTasks = [departmentSearcher, contentIdsSearcher, contentSearcher, orderRowsSearcher, prepaymentsSearcher, invoiceSearcher, stockReturnsSearcher];

        async.waterfall(waterfallTasks, function (err, result) {

            if (err) {
                return next(err);
            }
            getHistory(req, result, function (err, order) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(order);
            });
        });
    }





    this.getById = function (req, res, next) {
        getById(req, res, next);
    };

    this.getByViewType = function (req, res, next) {
        var query = req.query;
        var viewType = query.viewType;
        var id = req.query.id;

        if (id && id.length >= 24) {
            getById(req, res, next);
            return false;
        }

        switch (viewType) {
            case 'form':
                getById(req, res, next);
                break;
            default:
                getByViewType(req, res, next);
                break;
        }
    };

    this.remove = function (req, res, next) {
        var id = req.params.id;
        var project;
        var type = 'Not Ordered';
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var JobsModel = models.get(req.session.lastDb, 'jobs', JobsSchema);
        var wTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var editedBy = {
            user: req.session.uId,
            date: new Date()
        };

        Order.findByIdAndRemove(id, function (err, order) {
            if (err) {
                return next(err);
            }

            OrderRows.find({order: id}).populate('product', 'job').exec(function (err, docs) {
                    if (err) {
                        return next(err);
                    }

                    GoodsOutNote.remove({order: order._id}, function () {
                    });

                    async.each(docs, function (orderRow, cb) {
                        if (!orderRow.product.job) {
                            return cb();
                        }

                        Availability.update({product: orderRow.product._id}, {$set: {onHand: 1}}, function (err) {
                            if (err) {
                                return cb(err);
                            }

                            JobsModel.findByIdAndUpdate(orderRow.product.job, {
                                type    : type,
                                order   : null,
                                editedBy: editedBy
                            }, {new: true}, function (err, result) {
                                var wTracks;

                                if (err) {
                                    return cb(err);
                                }

                                project = result ? result.get('project') : null;
                                wTracks = result ? result.wTracks : [];

                                async.each(wTracks, function (wTr, callback) {
                                    wTrack.findByIdAndUpdate(wTr, {$set: {revenue: 0}}, callback);
                                }, function () {
                                    cb();
                                });
                            });
                        });

                    }, function () {
                        OrderRows.remove({order: id}, function (err) {
                            if (err) {
                                return next(err);
                            }
                        });

                        res.status(200).send({success: order});
                    });
                }
            );
        });
    };

    this.getForProject = function (req, res, next) {
        var db = req.session.lastDb;
        var projectId = req.params.id;
        var Order = models.get(db, 'Order', OrderSchema);
        var query = req.query;
        var queryObject = {};
        var optionsObject = {};
        var sort = {};
        var paginationObject = pageHelper(query);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var key;

        var departmentSearcher;
        var contentIdsSearcher;
        var contentSearcher;
        var waterfallTasks;

        projectId = projectId ? objectId(projectId) : null;

        if (projectId) {
            queryObject.project = projectId;
        }

        if (req.query.sort) {
            key = Object.keys(req.query.sort)[0];
            req.query.sort[key] = parseInt(req.query.sort[key], 10);
            sort = req.query.sort;
        } else {
            sort = {workflow: -1};
        }

        departmentSearcher = function (waterfallCallback) {
            models.get(req.session.lastDb, 'Department', DepartmentSchema).aggregate(
                {
                    $match: {
                        users: objectId(req.session.uId)
                    }
                }, {
                    $project: {
                        _id: 1
                    }
                },
                waterfallCallback);
        };

        contentIdsSearcher = function (deps, waterfallCallback) {
            var everyOne = rewriteAccess.everyOne();
            var owner = rewriteAccess.owner(req.session.uId);
            var group = rewriteAccess.group(req.session.uId, deps);
            var whoCanRw = [everyOne, owner, group];
            var matchQuery = {
                $and: [
                    queryObject,
                    {
                        $or: whoCanRw
                    }
                ]
            };

            Order.aggregate([{
                $match: matchQuery
            }, {
                $project: {
                    _id: 1
                }
            }], waterfallCallback);
        };

        contentSearcher = function (ids, waterfallCallback) {
            var salesManagerMatch = {
                $and: [
                    {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]},
                    {
                        $or: [{
                            $and: [{
                                $eq: ['$$projectMember.startDate', null]
                            }, {
                                $eq: ['$$projectMember.endDate', null]
                            }]
                        }, {
                            $and: [{
                                $lte: ['$$projectMember.startDate', '$quotation.orderDate']
                            }, {
                                $eq: ['$$projectMember.endDate', null]
                            }]
                        }, {
                            $and: [{
                                $eq: ['$$projectMember.startDate', null]
                            }, {
                                $gte: ['$$projectMember.endDate', '$quotation.orderDate']
                            }]
                        }, {
                            $and: [{
                                $lte: ['$$projectMember.startDate', '$quotation.orderDate']
                            }, {
                                $gte: ['$$projectMember.endDate', '$quotation.orderDate']
                            }]
                        }]
                    }]
            };

            optionsObject.$and = [];

            optionsObject.$and.push({_id: {$in: _.pluck(ids, '_id')}});

            Order
                .aggregate([{
                    $match: queryObject
                }, {
                    $lookup: {
                        from        : 'projectMembers',
                        localField  : 'project',
                        foreignField: 'projectId',
                        as          : 'projectMembers'
                    }
                }, {
                    $lookup: {
                        from        : 'Customers',
                        localField  : 'supplier',
                        foreignField: '_id',
                        as          : 'supplier'
                    }
                }, {
                    $lookup: {
                        from        : 'workflows',
                        localField  : 'workflow',
                        foreignField: '_id',
                        as          : 'workflow'
                    }
                }, {
                    $lookup: {
                        from        : 'currency',
                        localField  : 'currency._id',
                        foreignField: '_id',
                        as          : 'currency._id'
                    }
                }, {
                    $project: {
                        workflow       : {$arrayElemAt: ['$workflow', 0]},
                        supplier       : {$arrayElemAt: ['$supplier', 0]},
                        'currency._id' : {$arrayElemAt: ['$currency._id', 0]},
                        'currency.rate': 1,

                        salesManagers: {
                            $filter: {
                                input: '$projectMembers',
                                as   : 'projectMember',
                                cond : salesManagerMatch
                            }
                        },

                        paymentInfo: 1,
                        orderDate  : 1,
                        name       : 1,
                        status     : 1
                    }
                }, {
                    $project: {
                        salesManagers: {$arrayElemAt: ['$salesManagers', 0]},

                        supplier: {
                            _id : '$supplier._id',
                            name: '$supplier.name'
                        },

                        workflow: {
                            status: '$workflow.status',
                            name  : '$workflow.name'
                        },

                        currency   : 1,
                        paymentInfo: 1,
                        orderDate  : 1,
                        status     : 1,
                        name       : 1
                    }
                }, {
                    $lookup: {
                        from        : 'Employees',
                        localField  : 'salesManagers.employeeId',
                        foreignField: '_id',
                        as          : 'salesManagers'
                    }
                }, {
                    $project: {
                        salesPerson: {$arrayElemAt: ['$salesManagers', 0]},
                        workflow   : 1,
                        supplier   : 1,
                        currency   : 1,
                        paymentInfo: 1,
                        orderDate  : 1,
                        name       : 1,
                        status     : 1
                    }
                }, {
                    $project: {
                        salesPerson: {
                            _id : '$salesPerson._id',
                            name: '$salesPerson.name'
                        },

                        workflow   : 1,
                        supplier   : 1,
                        currency   : 1,
                        paymentInfo: 1,
                        orderDate  : 1,
                        name       : 1,
                        status     : 1,
                        removable  : {
                            $cond: {
                                if  : {$and: [{$ne: ['$workflow.status', 'Done']}, {$ne: ['$status.fulfillStatus', 'ALL']}]},
                                then: true,
                                else: false
                            }
                        }
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
                        _id        : '$root._id',
                        salesPerson: '$root.salesPerson',
                        workflow   : '$root.workflow',
                        supplier   : '$root.supplier',
                        currency   : '$root.currency',
                        paymentInfo: '$root.paymentInfo',
                        orderDate  : '$root.orderDate',
                        status     : '$root.status',
                        name       : '$root.name',
                        removable  : '$root.removable',
                        total      : 1
                    }
                }, {
                    $sort: sort
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }], function (err, result) {
                    waterfallCallback(null, result);
                });
        };

        waterfallTasks = [departmentSearcher, contentIdsSearcher, contentSearcher];

        async.waterfall(waterfallTasks, function (err, result) {
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
    };

    this.getFilterValues = function (req, res, next) {
        var Quotation = models.get(req.session.lastDb, 'Quotation', QuotationSchema);

        async.waterfall([
            function (cb) {
                Quotation
                    .aggregate([
                        {
                            $group: {
                                _id         : null,
                                'Order date': {
                                    $addToSet: '$orderDate'
                                }
                            }
                        }
                    ], function (err, quot) {
                        if (err) {
                            return cb(err);

                        }

                        cb(null, quot);
                    });
            },
            function (quot, cb) {
                cb(null, quot);
            }

        ], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);

        });
    };

    this.bulkRemove = function (req, res, next) {
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        // todo some validation on ids array, like check for objectId

        Order.remove({_id: {$in: ids}}, function (err, removed) {
            if (err) {
                return next(err);
            }

            OrderRows.remove({order: {$in: ids}}, function (err, docs) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(removed);
            });

        });
    };

    this.getByWorkflows = function (req, res, next) {
        var dbIndex = req.session.lastDb;
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var data = req.query;
        var forSales = data.forSales === 'true';
        var filter = data.filter || {};
        var match = filterMapper.mapFilter(filter, {contentType: orderCT});

        if (!forSales) {
            Order = models.get(dbIndex, purchaseOrderCT, purchaseOrdersSchema);
            match = filterMapper.mapFilter(filter, {contentType: purchaseOrderCT});
        }

        Order.aggregate([{
            $match: match
        }, {
            $match: {
                forSales: forSales
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                sum     : {$divide: ['$paymentInfo.total', '$currency.rate']},
                workflow: {$arrayElemAt: ['$workflow', 0]},
                status  : 1
            }
        }, {
            $group: {
                _id   : '$workflow._id',
                total : {$sum: '$sum'},
                status: {$addToSet: '$status'},
                name  : {$first: '$workflow.name'},
                count : {$sum: 1}
            }
        }, {
            $project: {
                total : {$divide: ['$total', 100]},
                name  : 1,
                count : 1,
                status: 1
            }
        }], function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });

    };

    this.getBySupplier = function(req, res, next) {
        var ids = req.query.ids || req.params.ids;
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var Prepayments = models.get(req.session.lastDb, 'prepayment', PrepaymentSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var Invoice = models.get(req.session.lastDb, 'Invoices', InvoiceSchema);
        var Currency = models.get(req.session.lastDb, 'currency', CurrencySchema);
        var arr = [];
        
        async.map(ids, function(id, cb) {

            var departmentSearcher;
            var contentIdsSearcher;
            var orderRowsSearcher;
            var contentSearcher;
            var prepaymentsSearcher;
            var invoiceSearcher;
            var stockReturnsSearcher;
            var waterfallTasks;

            departmentSearcher = function (waterfallCallback) {
                models.get(req.session.lastDb, 'Department', DepartmentSchema).aggregate(
                    {
                        $match: {
                            users: objectId(req.session.uId)
                        }
                    }, {
                        $project: {
                            _id: 1
                        }
                    },

                    waterfallCallback);
            };

            contentIdsSearcher = function (deps, waterfallCallback) {
                var everyOne = rewriteAccess.everyOne();
                var owner = rewriteAccess.owner(req.session.uId);
                var group = rewriteAccess.group(req.session.uId, deps);
                var whoCanRw = [everyOne, owner, group];
                var matchQuery = {
                    $or: whoCanRw
                };

                var Model = models.get(req.session.lastDb, 'Order', OrderSchema);

                Model.aggregate({
                    $match: matchQuery
                }, {
                    $project: {
                        _id: 1
                    }
                }, waterfallCallback);
            };

            contentSearcher = function (quotationsIds, waterfallCallback) {
                var query;

                query = Order.findById(id);

                query
                    .populate('supplier', '_id name fullName address')
                    .populate('destination')
                    .populate('currency._id')
                    .populate('incoterm')
                    .populate('priceList', 'name')
                    .populate('costList', 'name')
                    .populate('warehouse', 'name')
                    .populate('salesPerson', 'name')
                    .populate('invoiceControl')
                    .populate('paymentTerm')
                    .populate('paymentMethod', '_id name account bank address swiftCode owner')
                    .populate('editedBy.user', '_id login')
                    .populate('deliverTo', '_id, name')
                    .populate('project', '_id name')
                    .populate('shippingMethod', '_id name')
                    .populate('workflow', '_id name status');

                query.exec(waterfallCallback);
            };

            orderRowsSearcher = function (order, waterfallCallback) {


                OrderRows.find({order: order._id})
                    .populate('product')
                    .populate('debitAccount', 'name')
                    .populate('creditAccount', 'name')
                    .populate('taxes.taxCode', 'fullName rate')
                    .populate('warehouse', 'name')
                    .sort('products')
                    .exec(function (err, docs) {
                        if (err) {
                            return waterfallCallback(err);
                        }

                        order = order.toJSON();

                        getAvailableForRows(req, docs, order.forSales, function (err, docs, goodsNotes) {
                            if (err) {
                                return waterfallCallback(err);
                            }

                            order.products = docs;
                            order.account = docs && docs.length ? docs[0].debitAccount : {};

                            order.goodsNotes = goodsNotes;
                            waterfallCallback(null, order);
                        });

                    });
            };

            prepaymentsSearcher = function (order, waterfallCallback) {
                Prepayments.aggregate([{
                    $match: {
                        order: objectId(id)
                    }
                }, {
                    $project: {
                        paidAmount: 1,
                        currency  : 1,
                        date      : 1,
                        name      : 1,
                        refund    : 1
                    }
                }, {
                    $project: {
                        paidAmount: {$divide: ['$paidAmount', '$currency.rate']},
                        date      : 1,
                        name      : 1,
                        refund    : 1
                    }
                }, {
                    $project: {
                        paidAmount: {$cond: [{$eq: ['$refund', true]}, {$multiply: ['$paidAmount', -1]}, '$paidAmount']},
                        date      : 1,
                        name      : 1,
                        refund    : 1
                    }
                }, {
                    $group: {
                        _id  : null,
                        sum  : {$sum: '$paidAmount'},
                        names: {$push: '$name'},
                        date : {$min: '$date'}
                    }
                }], function (err, result) {
                    if (err) {
                        return waterfallCallback(err);
                    }

                    order.prepayment = result && result.length ? result[0] : {};

                    waterfallCallback(null, order);
                });
            };

            invoiceSearcher = function (order, waterfallCallback) {
                Invoice.aggregate([{
                    $match: {
                        sourceDocument: objectId(id)
                    }
                }, {
                    $project: {
                        name: 1
                    }
                }], function (err, result) {
                    if (err) {
                        return waterfallCallback(err);
                    }

                    order.invoice = result && result.length ? result[0] : {};
                    waterfallCallback(null, order);
                });
            };

            stockReturnsSearcher = function (order, waterfallCallback) {
                StockReturnsService.findForOrder({
                    query : {order: objectId(order._id)},
                    dbName: req.session.lastDb
                }, function (err, docs) {
                    if (err) {
                        return waterfallCallback(err);
                    }

                    order.stockReturns = docs || [];

                    waterfallCallback(null, order);
                })
            };

            waterfallTasks = [departmentSearcher, contentIdsSearcher, contentSearcher, orderRowsSearcher, prepaymentsSearcher, invoiceSearcher, stockReturnsSearcher];

            async.waterfall(waterfallTasks, function (err, result) {

                if (err) {
                    return next(err);
                }

                getHistory(req, result, function (err, order) {
                    if (err) {
                        return next(err);
                    }

                    arr.push(order);
                    cb(null,order);
                });
            });

        }, function(err){
            if (err) {
                return next(err);
            }

            res.status(200).send(arr);
        });
    };

    this.importexcel = function(req, res, next){
        var data = req.body;
        var file = req.files && req.files.file ? req.files.file : null;
        var Project = models.get(req.session.lastDb, 'Project', ProjectSchema);
        var Product = models.get(req.session.lastDb, 'Product', ProductSchema);
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var purchaseOrders = models.get(req.session.lastDb, 'purchaseOrders', purchaseOrdersSchema);
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var Workflow = models.get(req.session.lastDb, 'workflow', WorkflowSchema);
        var userId = req.session.uId;
        var list = xlsx.parse(file.path);
        var tempResult = [];
        var error;
        var status = {
            allocateStatus: 'NOT',
            fulfillStatus : 'NOT',
            shippingStatus: 'NOT'

        };

        var excelName = req.params.id.search('.xlsx');

        if(excelName == -1){
            var jsonfileName = '../uploads/exceljson/' + req.params.id.replace('.xls','') + '.json';
        }
        else{
            var jsonfileName = '../uploads/exceljson/' + req.params.id.replace('.xlsx','') + '.json';
        }

        var jsonFile = require(jsonfileName);

        function findAndReplaceId(callback){
            if(list[0].data.length != 0){
                list[0].data.shift();
            };
            
            var projectName = list[0].data[0][1];
            var projectId;
            
            Project.findOne({name : projectName}, function (err, mod) {

                if (err) {
                    callback(err);
                } else {
                    if (mod) {
                        projectId = mod._id;
                        callback(null,projectId);

                    } else {
                        error = new Error('name = ' + projectName + ' 在数据库中不存在');
                        error.status = 400;
                        callback(error);
                    }
                }
            });
        };

        function findWorkflow(projectId, callback){
            Workflow.find({status : "New", wId : "Purchase Order"})
                .exec(function (err, workflow) {
                    if (err) {
                        return waterfallCallback(err);
                    }

                    var para = {};
                    para.projectId = projectId;
                    if(workflow.length == 0){
                        error = new Error('采购订单没有对应的工作流状态！');
                        error.status = 400;
                        callback(error);
                    } else{
                        para.workflowId = workflow[0]._id;
                        callback(null, para);
                    }
            });
        };

        function checkProduct(para, callback){
            var isDo = true;
            var noneProduct = '';
            var products = [];

            async.each(list,function(listObj, asyncCb1){

                for(var i = 2; i < jsonFile.startLine; i++){
                    listObj.data.shift();
                }

                async.eachSeries(listObj.data,function(tempObj, asyncCb2){
                    if(tempObj[0] != null && tempObj[0] != '总计'){ 
                        var name = tempObj[jsonFile.product] ? tempObj[jsonFile.product] : '';
                        if(products.length != 0){
                            var flag = true;
                            products.forEach(function(product){
                                if(product.name == name){
                                    flag = false;
                                }
                            });
                            if(flag == false){
                                asyncCb2(null);
                            } else{
                                Product.findOne({name : name, canBePurchased : true}, function (err, mod) {
                                    if (err) {
                                        asyncCb2(err);
                                    }

                                    if(!mod){
                                        isDo = false;
                                        noneProduct = noneProduct.concat(' ', name);
                                    } else{
                                        products.push(mod);
                                    }
                                    asyncCb2(null);
                                });
                            }
                        } else{
                            Product.findOne({name : name, canBePurchased : true}, function (err, mod) {
                                if (err) {
                                    asyncCb2(err);
                                }

                                if(!mod){
                                    isDo = false;
                                    noneProduct = noneProduct.concat(' ', name);
                                } else{
                                    products.push(mod);
                                }
                                asyncCb2(null);
                            });
                        }
                    } else{
                        asyncCb2(null);
                    }
                },function(err){
                    if(err){
                        asyncCb1(err);
                    }else{
                        asyncCb1(null)
                    }
                });
            },function(err){
                if (err) {
                    callback(err);
                }else{
                    if(isDo == false){
                        error = new Error('材料基础库暂无'+ noneProduct +'产品，或者产品属性为不可采购。');
                        error.status = 500;
                        callback(error);
                    }else{
                        para.products = products;
                        callback(null, para);
                    }
                }
            });
        };

        function getTotal(para, callback){

            async.each(list,function(listObj, asyncCb){

                var orderData = {
                    project : para.projectId,
                    status  : status,
                    orderType : 'purchaseOrder',
                    forSales : false,
                    workflow : para.workflowId 
                };

                orderData.createdBy = {};

                orderData.createdBy.user = req.session.uId;

                var order = new purchaseOrders(orderData);
                order.save(function(err, result){
                    if(err){
                        return next(err);
                    }

                    async.each(listObj.data,function(tempObj, asyncCb1){
                        if(tempObj[0] != null && tempObj[0] != '总计'){
                            var xlsData = {};
                            var parameters = [];
                            var tempCode;
                            var productId;                

                            var priceQty = tempObj[jsonFile.priceQty];
                            var product = tempObj[jsonFile.product];
                            var quantity = tempObj[jsonFile.quantity];
                            var description = tempObj[jsonFile.description];

                            for(var key in jsonFile.fields_name){
                                parameters.push({
                                    paraname     : jsonFile.fields_name[key],
                                    value        : tempObj[key]
                                });
                            }

                            async.each(para.products, function(inventory, asyncCb2){
                                if(inventory.name == product){
                                    productId = inventory._id;
                                    asyncCb2(null);
                                } else{
                                    asyncCb2(null);
                                }
                            }, function(err){
                                if(err){
                                    asyncCb1(err);
                                }

                                var orderRowsData = {
                                    product    : productId,
                                    priceQty   : priceQty,
                                    quantity   : quantity,
                                    description: description,
                                    parameters : parameters,
                                    order      : result._id
                                }

                                var orderRows = new OrderRows(orderRowsData);
                                orderRows.save(function(err, rowsResult){
                                    if(err){
                                        asyncCb1(err);
                                    }
                                })
                                tempResult.push(orderRowsData);
                                asyncCb1(null, tempResult);
                            });
                        } else{
                            asyncCb1(null, tempResult);
                        }
                    }, function(err){
                        if(err){
                            asyncCb(err);
                        }
                        asyncCb(null, tempResult);
                    });
                });
            }, function(err){
                if(err){
                    callback(err);
                }
                callback(null,tempResult);
            });
        };

        async.waterfall([findAndReplaceId, findWorkflow, checkProduct, getTotal], function(err, excelResult){

            if(err){
                return next(err);
            }

            var response = {};

            response.data = excelResult;
           
            res.status(200).send(response);
        });        
    };

    this.catchPrices = function(req, res, next){
        var crawlerResultsModel = models.get(req.session.lastDb, 'crawlerResults', crawlerResultsSchema);
        var marketSettingsModel = models.get(req.session.lastDb, 'marketSettings', marketSettingsSchema);
        var data = req.query;
        var date = data.date;
        var products = [];
        var dayTime = date.split("-").join("").trim();
        var Tasks = models.get(req.session.lastDb, 'purchaseContract', QuotationContractSchema);
        var error;

        Tasks.findById(data.id)
            .populate('products.product', '_id name info')
            .lean()
            .exec(function (err, task) {
                if (err) {
                    next(err);
                }
                if(task.products.length == 0){
                    error = new Error('采购合同中未设置供货产品！');
                    next(error);
                } else{
                    async.each(task.products, function (product, cb){
                        var marketId = product.sourceAl;
                        marketSettingsModel.findOne({_id : marketId}, function (err, market){
                            var classId = market.classId;
                            crawlerResultsModel.findOne({dayTime : dayTime, classId : classId}, function (err, crawlerResult) {
                                if(err) {
                                    console.log(err);
                                }

                                if(crawlerResult){
                                    product.average = crawlerResult.average;
                                }

                                products.push(product);
                                cb(null);
                            });
                        });
                    }, function (err){
                        if(err){
                            return next(err);
                        }
                        var response = {};
                        if(products[0].average){
                            response.products = products;
                            res.status(200).send(response);
                        } else{
                            error = new Error('当日未获取铝锭价！');
                            next(error);
                        }
                    });
                }
            });

    };

};

module.exports = Module;
