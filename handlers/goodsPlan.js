var mongoose = require('mongoose');

var Module = function(models, event) {
    'use strict';

    var DepartmentSchema = mongoose.Schemas.Department;
    var objectId = mongoose.Types.ObjectId;
    var WorkflowSchema = mongoose.Schemas.workflow;
    var rewriteAccess = require('../helpers/rewriteAccess');
    var accessRoll = require('../helpers/accessRollHelper.js')(models);
    var async = require('async');
    var mapObject = require('../helpers/bodyMaper');
    var _ = require('../node_modules/underscore');
    var goodsOutNotesService = require('../services/goodsOutNotes')(models);
    var OrderSchema = mongoose.Schemas.Order;
    var GoodsOutSchema = mongoose.Schemas.GoodsOutNote;
    var GoodsInSchema = mongoose.Schemas.GoodsInNote;
    var OrderRowsSchema = mongoose.Schemas.OrderRow;
    var ProjectSchema = mongoose.Schemas.Project;
    var ProductSchema = mongoose.Schemas.Products;
    var AvailabilitySchema = mongoose.Schemas.productsAvailability;
    var WarehouseSchema = mongoose.Schemas.warehouse;
    var buildingSchema = mongoose.Schemas.Building;
    var HistoryService = require('../services/history.js')(models);
    var path = require('path');
    var CONSTANTS = require('../constants/mainConstants.js');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var filterMapper = new FilterMapper();
    var GoodsOutNote = require('./goodsOutNote');
    var goodsOutNote = new GoodsOutNote(models, event);
    var GoodsInNotes = require('./goodsInNote');
    var goodsInNotes = new GoodsInNotes(models, event);
    var goodsAllocateSchema = mongoose.Schemas.goodsAllocate;
    var fs = require('fs');
    var orderCT = 'order';
    var xlsx = require('node-xlsx');

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
            async.each(deletedOrderRows, function(orderRowId, cb) {
                OrderRows.findByIdAndRemove(orderRowId, function(err) {
                    if (err) {
                        return cb(err);
                    }

                    cb();
                });
            }, function(err) {
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

                fs.unlink(path, function(err) {
                    fs.readdir(dir, function() {
                        if (data.attachments && data.attachments.length === 0) {
                            fs.rmdir(dir, function() {});
                        }
                    });
                });

                delete data.fileName;

                Order.findByIdAndUpdate(id, { $set: data }, { new: true }, function(err, oredr) {
                    if (err) {
                        return next(err);
                    }

                    getById(req, res, next);
                });

            } else {
                Order.findByIdAndUpdate(id, { $set: data }, { new: true }, function(err, order) {
                    var historyOptions;

                    if (err) {
                        return next(err);
                    }

                    historyOptions = {
                        contentType: 'order',
                        data: data,
                        dbName: dbName,
                        contentId: id
                    };

                    HistoryService.addEntry(historyOptions, function() {
                        if (orderRows) {
                            async.each(orderRows, function(orderRow, cb) {
                                var id = orderRow.id;
                                var row;

                                if (!id) {
                                    orderRow.order = order._id;
                                    row = new OrderRows(orderRow);
                                    row.save(function(err, elem) {
                                        if (err) {
                                            return cb(err);
                                        }
                                        cb();
                                    });
                                } else {
                                    delete orderRow.id;
                                    OrderRows.findByIdAndUpdate(id, orderRow, { new: true }, function(err, doc) {
                                        if (err) {
                                            return cb(err);
                                        }
                                        cb();
                                    });
                                }

                            }, function(err) {
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
            dbName: req.session.lastDb,
            id: order._id
        };

        HistoryService.getHistoryForTrackedObject(historyOptions, function(err, history) {
            var notes;

            if (err) {
                return cb(err);
            }

            notes = history.map(function(elem) {
                return {
                    date: elem.date,
                    history: elem,
                    user: elem.editedBy
                };
            });

            if (!order.notes) {
                order.notes = [];
            }
            order.notes = order.notes.concat(notes);
            order.notes = _.sortBy(order.notes, 'date');
            cb(null, order);

        }, true);

    }

    function getAvailableForRows(req, docs, project, warehouseId, cb) {
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutSchema);
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var populateDocs = [];
        var allGoodsNotes = [];
        if (docs && docs.length) {
            async.eachSeries(docs, function(elem, eachCb) {
                var product;
                var projectId = project;
                var parallelTasks;

                elem = elem.toJSON();
                product = elem.product ? elem.product._id : null;

                function getAvailabilities(parallelCb) {
                    Availability.aggregate([{
                            $project: {
                                _id: 1,
                                product: 1,
                                onHand: 1,
                                warehouse: 1,
                                location: 1,
                                orderRows: 1,
                                goodsOutNotes: 1,
                                goodsInNotes: 1,
                                cost: 1,
                                creationDate: 1,
                                //project : '$projectId'
                            }
                        }, {
                            $lookup: {
                                from: 'locations',
                                localField: 'location',
                                foreignField: '_id',
                                as: 'location'
                            }
                        },
                        /*{
                                                $lookup: {
                                                    from        : 'Project',
                                                    localField  : 'project',
                                                    foreignField: '_id',
                                                    as          : 'project'
                                                }
                                            },*/
                        {
                            $project: {
                                _id: 1,
                                product: 1,
                                onHand: 1,
                                warehouse: 1,
                                location: { $arrayElemAt: ['$location', 0] },
                                cost: 1,
                                creationDate: 1,
                                //project : {$arrayElemAt: ['$project', 0]},
                                filterRows: {
                                    $filter: {
                                        input: '$orderRows',
                                        as: 'elem',
                                        cond: { $eq: ['$$elem.orderRowId', objectId(elem._id)] }
                                    }
                                },
                                orderRows: 1,
                                goodsOutNotes: 1,
                                goodsInNotes: 1
                            }
                        }, {
                            $project: {
                                _id: 1,
                                product: 1,
                                onHand: 1,
                                warehouse: 1,
                                'location.name': 1,
                                'location._id': 1,
                                cost: 1,
                                creationDate: 1,
                                //'project.projectCode' : 1,
                                allocated: {
                                    $sum: '$filterRows.quantity'
                                },
                                allocatedAll: {
                                    $sum: '$orderRows.quantity'
                                },
                                fulfillAll: {
                                    $sum: '$goodsOutNotes.quantity'
                                },
                                goodsInNotes: 1,
                                orderRows: 1
                            }
                        }, {
                            $project: {
                                _id: 1,
                                product: 1,
                                onHand: 1,
                                warehouse: 1,
                                location: 1,
                                cost: 1,
                                creationDate: 1,
                                //project : 1,
                                allocated: 1,
                                inStock: {
                                    $add: ['$onHand', '$allocatedAll', '$fulfillAll']
                                },
                                goodsInNotes: 1,
                                orderRows: 1
                            }
                        }, {
                            $match: {
                                product: objectId(product),
                                warehouse: warehouseId
                            }
                        }
                    ], function(err, availability) {

                        if (err) {
                            return parallelCb(err);
                        }

                        if (availability.length) {
                            async.map(availability, function(av, callback1) {

                                async.map(av.goodsInNotes, function(goodsIn, callback2) {

                                    GoodsInNote.findById(goodsIn.goodsNoteId, function(err, goodsInNote) {
                                        var paras = [];
                                        if (err) {
                                            return callback2(err);
                                        }
                                        for (var i = 0; i < goodsInNote.orderRows.length; i++) {
                                            if (goodsInNote.orderRows[i].product.toString() === product.toString()) {
                                                paras = goodsInNote.orderRows[i].parameters;
                                            }
                                        }
                                        if (goodsInNote.isValid || (goodsInNote.status.approved && !goodsInNote.description)) {
                                            goodsIn.goodsNoteId = goodsInNote;
                                            goodsIn.parameters = paras;
                                            callback2(null, goodsIn);
                                        } else {
                                            callback2(null);
                                        }
                                    });

                                }, function(err, goodsInNotes) {
                                    if (err) {
                                        return callback1(err);
                                    }
                                    av.goodsInNotes = _.compact(goodsInNotes);

                                    callback1(null, av);
                                });

                            }, function(err, as) {
                                if (err) {
                                    return parallelCb(err);
                                }
                                parallelCb(null, as);
                            });
                        } else {
                            parallelCb(null, availability);
                        }
                    });
                }

                function getNotes(parallelCb) {

                    GoodsOutNote.aggregate([{
                        $match: {
                            'orderRows.orderRowId': elem._id,
                            _type: 'GoodsOutNote',
                            archived: { $ne: true }
                        }
                    }, {
                        $lookup: {
                            from: 'warehouse',
                            localField: 'warehouse',
                            foreignField: '_id',
                            as: 'warehouse'
                        }
                    }, {
                        $lookup: {
                            from: 'Order',
                            localField: 'order',
                            foreignField: '_id',
                            as: 'order'
                        }
                    }, {
                        $project: {
                            name: '$name',
                            orderRow: {
                                $filter: {
                                    input: '$orderRows',
                                    as: 'elem',
                                    cond: { $eq: ['$$elem.orderRowId', objectId(elem._id)] }
                                }
                            },

                            warehouse: { $arrayElemAt: ['$warehouse', 0] },
                            order: { $arrayElemAt: ['$order', 0] },
                            status: 1
                        }
                    }, {
                        $project: {
                            name: '$name',
                            orderRow: { $arrayElemAt: ['$orderRow', 0] },
                            status: 1,
                            warehouse: 1,
                            'order.name': 1
                        }
                    }, {
                        $project: {
                            name: '$name',
                            orderRow: '$orderRow.orderRowId',
                            quantity: '$orderRow.quantity',
                            status: 1,
                            warehouse: 1,
                            'order.name': 1,
                            gnotesDeliver: '$orderRow.gnotesDeliver'
                        }
                    }], function(err, docs) {
                        if (err) {
                            return parallelCb(err);
                        }
                        if (docs && docs.length) {
                            docs = docs.map(function(el) {
                                el._id = el._id.toJSON();
                                return el;
                            });
                        }

                        parallelCb(null, docs);
                    });
                }

                parallelTasks = [getNotes, getAvailabilities];

                async.parallel(parallelTasks, function(err, response) {
                    var availability;
                    var goodsNotes;

                    if (err) {
                        return eachCb(err);
                    }

                    availability = response[1];
                    goodsNotes = response[0];
                    allGoodsNotes = allGoodsNotes.concat(goodsNotes);

                    if (availability.length) {
                        elem.pa = availability;
                    } else {
                        elem.pa = [];
                    }
                    elem.goodsNotes = goodsNotes;
                    elem.fulfilled = 0;

                    if (goodsNotes && goodsNotes.length) {
                        goodsNotes.forEach(function(el) {
                            elem.fulfilled += el.quantity;
                        });
                    }
                    populateDocs.push(elem);
                    eachCb();
                });

            }, function(err) {
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
            queryObject.$and.push(filterMapper.mapFilter(filter, { contentType: contentType }));
        }

        if (data.sort) {
            key = Object.keys(data.sort)[0];
            data.sort[key] = parseInt(data.sort[key], 10);
            sort = data.sort;
        } else {
            sort = { orderDate: -1 };
        }

        queryObject.$and.push({ orderType: 'goodsPlan' });

        if (pastDue) {
            optionsObject.$and.push({ expectedDate: { $gt: new Date(filter.date.value[1]) } }, { 'workflow.status': { $ne: 'Done' } });
        }

        accessRollSearcher = function(cb) {
            accessRoll(req, Order, cb);
        };

        contentSearcher = function(ids, cb) {
            var newQueryObj = {};

            var salesManagerMatch = {
                $and: [
                    { $eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)] },
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
                    }
                ]
            };

            /*if (queryObject && queryObject.$and && queryObject.$and.length && queryObject.$and[0].name) {
             queryObject.$and[0] = {
             name: queryObject.$and[0].name.$in[0]
             };
             }*/

            newQueryObj.$and = [];
            newQueryObj.$and.push(queryObject);
            newQueryObj.$and.push({ _id: { $in: ids } });

            Order.aggregate([{
                    $lookup: {
                        from: 'projectMembers',
                        localField: 'project',
                        foreignField: 'projectId',
                        as: 'projectMembers'
                    }
                }, {
                    $lookup: {
                        from: 'Payment',
                        localField: '_id',
                        foreignField: 'order',
                        as: 'payments'
                    }
                }, {
                    $lookup: {
                        from: 'Customers',
                        localField: 'supplier',
                        foreignField: '_id',
                        as: 'supplier'
                    }
                }, {
                    $lookup: {
                        from: 'workflows',
                        localField: 'workflow',
                        foreignField: '_id',
                        as: 'workflow'
                    }
                }, {
                    $lookup: {
                        from: 'currency',
                        localField: 'currency._id',
                        foreignField: '_id',
                        as: 'currency._id'
                    }
                }, {
                    $lookup: {
                        from: 'building',
                        localField: 'building',
                        foreignField: '_id',
                        as: 'project'
                    }
                }, {
                    $lookup: {
                        from: 'Employees',
                        localField: 'salesPerson',
                        foreignField: '_id',
                        as: 'salesPerson'
                    }
                }, {
                    $lookup: {
                        from: 'integrations',
                        localField: 'channel',
                        foreignField: '_id',
                        as: 'channel'
                    }
                }, {
                    $lookup: {
                        from: 'orderRows',
                        localField: '_id',
                        foreignField: 'order',
                        as: 'products'
                    }
                }, {
                    $project: {
                        workflow: { $arrayElemAt: ['$workflow', 0] },
                        supplier: { $arrayElemAt: ['$supplier', 0] },
                        'currency._id': { $arrayElemAt: ['$currency._id', 0] },
                        payments: 1,
                        'currency.rate': 1,
                        salesManagers: {
                            $filter: {
                                input: '$projectMembers',
                                as: 'projectMember',
                                cond: salesManagerMatch
                            }
                        },

                        channel: { $arrayElemAt: ['$channel', 0] },
                        salesPerson: { $arrayElemAt: ['$salesPerson', 0] },
                        orderRows: 1,
                        paymentInfo: 1,
                        orderDate: 1,
                        name: 1,
                        status: 1,
                        _type: 1,
                        forSales: 1,
                        products: 1,
                        orderType: 1,
                        project: { $arrayElemAt: ['$project', 0] },
                        type: 1
                    }
                },

                {
                    $project: {
                        salesManager: { $arrayElemAt: ['$salesManagers', 0] },
                        supplier: {
                            _id: '$supplier._id',
                            name: { $concat: ['$supplier.name.first', ' ', '$supplier.name.last'] }
                        },

                        workflow: {
                            _id: '$workflow._id',
                            status: '$workflow.status',
                            name: '$workflow.name'
                        },

                        channel: {
                            _id: '$channel._id',
                            name: '$channel.channelName',
                            type: '$channel.type'
                        },

                        currency: 1,
                        paymentInfo: 1,
                        orderDate: 1,
                        salesPerson: 1,
                        name: 1,
                        isOrder: 1,
                        proformaCounter: 1,
                        payments: 1,
                        status: 1,
                        _type: 1,
                        forSales: 1,
                        products: 1,
                        orderType: 1,
                        project: 1,
                        type: 1
                    }
                }, {
                    $lookup: {
                        from: 'Employees',
                        localField: 'salesManager.employeeId',
                        foreignField: '_id',
                        as: 'salesManager'
                    }
                }, {
                    $project: {
                        salesPerson: { $ifNull: ['$salesPerson', { $arrayElemAt: ['$salesManager', 0] }] },
                        workflow: 1,
                        supplier: 1,
                        currency: 1,
                        paymentInfo: 1,
                        orderDate: 1,
                        payments: 1,
                        name: 1,
                        status: 1,
                        _type: 1,
                        forSales: 1,
                        channel: 1,
                        products: 1,
                        orderType: 1,
                        project: 1,
                        type: 1
                    }
                }, {
                    $project: {
                        salesPerson: {
                            _id: '$salesPerson._id',
                            name: { $concat: ['$salesPerson.name.first', ' ', '$salesPerson.name.last'] }
                        },
                        workflow: 1,
                        supplier: 1,
                        currency: 1,
                        paymentInfo: 1,
                        orderDate: 1,
                        name: 1,
                        status: 1,
                        _type: 1,
                        forSales: 1,
                        channel: 1,
                        payments: 1,
                        products: 1,
                        orderType: 1,
                        project: 1,
                        type: 1,
                        removable: {
                            $cond: {
                                if: { $and: [{ $ne: ['$workflow.status', 'Done'] }, { $ne: ['$status.fulfillStatus', 'ALL'] }] },
                                then: true,
                                else: false
                            }
                        }
                    }
                }, {
                    $match: newQueryObj
                }, {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        root: { $push: '$$ROOT' }
                    }
                }, {
                    $unwind: '$root'
                }, {
                    $project: {
                        _id: '$root._id',
                        salesPerson: '$root.salesPerson',
                        workflow: '$root.workflow',
                        supplier: '$root.supplier',
                        currency: '$root.currency',
                        paymentInfo: '$root.paymentInfo',
                        orderDate: '$root.orderDate',
                        name: '$root.name',
                        status: '$root.status',
                        removable: '$root.removable',
                        channel: '$root.channel',
                        payments: '$root.payments',
                        products: '$root.products',
                        orderType: '$root.orderType',
                        project: '$root.project',
                        type: '$root.type',
                        total: 1
                    }
                }, {
                    $unwind: {
                        path: '$payments',
                        preserveNullAndEmptyArrays: true
                    }
                }, {
                    $project: {
                        salesPerson: 1,
                        workflow: 1,
                        supplier: 1,
                        currency: 1,
                        paymentInfo: 1,
                        orderDate: 1,
                        name: 1,
                        status: 1,
                        removable: 1,
                        channel: 1,
                        products: 1,
                        orderType: 1,
                        project: 1,
                        type: 1,
                        total: 1,
                        'payments.currency': 1,
                        'payments.paidAmount': { $cond: [{ $eq: ['$payments.refund', true] }, { $multiply: ['$payments.paidAmount', -1] }, '$payments.paidAmount'] }
                    }
                }, {
                    $group: {
                        _id: '$_id',
                        salesPerson: { $first: '$salesPerson' },
                        workflow: { $first: '$workflow' },
                        supplier: { $first: '$supplier' },
                        currency: { $first: '$currency' },
                        paymentInfo: { $first: '$paymentInfo' },
                        orderDate: { $first: '$orderDate' },
                        name: { $first: '$name' },
                        status: { $first: '$status' },
                        removable: { $first: '$removable' },
                        channel: { $first: '$channel' },
                        products: { $first: '$products' },
                        orderType: { $first: '$orderType' },
                        project: { $first: '$project' },
                        paymentsPaid: { $sum: { $divide: ['$payments.paidAmount', '$payments.currency.rate'] } },
                        type: { $first: '$type' },
                        total: { $first: '$total' }
                    }
                }, {
                    $sort: sort
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }
            ], cb);
        };

        waterfallTasks = [accessRollSearcher, contentSearcher];

        async.waterfall(waterfallTasks, function(err, result) {
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

    function getById(req, res, next) {
        var id = req.query.id || req.params.id;
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var departmentSearcher;
        var contentIdsSearcher;
        var orderRowsSearcher;
        var contentSearcher;
        var waterfallTasks;

        if (id.length < 24) {
            return res.status(400).send();
        }

        departmentSearcher = function(waterfallCallback) {
            models.get(req.session.lastDb, 'Department', DepartmentSchema).aggregate({
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

        contentIdsSearcher = function(deps, waterfallCallback) {
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

        contentSearcher = function(quotationsIds, waterfallCallback) {

            var query;

            query = Order.findById(id);

            query
                .populate('editedBy.user', '_id login')
                .populate('building', '_id name')
                .populate('workflow', 'name status')

            query.exec(waterfallCallback);
        };

        orderRowsSearcher = function(order, waterfallCallback) {
            OrderRows.find({ order: order._id })
                .populate('product', '_id name code')
                .sort('products')
                .exec(function(err, docs) {
                    if (err) {
                        return waterfallCallback(err);
                    }

                    order = order.toJSON();

                    getAvailableForRows(req, docs, order.building._id, order.warehouse, function(err, docs, goodsNotes) {
                        if (err) {
                            return waterfallCallback(err);
                        }

                        order.products = docs;
                        order.goodsNotes = goodsNotes;
                        waterfallCallback(null, order);
                    });

                });
        };

        waterfallTasks = [departmentSearcher, contentIdsSearcher, contentSearcher, orderRowsSearcher];

        async.waterfall(waterfallTasks, function(err, result) {

            if (err) {
                return next(err);
            }

            getHistory(req, result, function(err, order) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(order);
            });
        });
    }

    this.getByViewType = function(req, res, next) {
        getByViewType(req, res, next);
    }

    this.getById = function(req, res, next) {
        getById(req, res, next);
    }

    this.putchModel = function(req, res, next) {
        var id = req.params.id;
        var data = mapObject(req.body);

        data.editedBy = {
            user: req.session.uId,
            date: new Date().toISOString()
        };

        updateOnlySelectedFields(req, res, next, id, data);
    };

    this.updateModel = function(req, res, next) {
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

            getGoodsOutNotes = function(callback) {
                goodsOutNotesService.getByOrder({ dbName: db, order: objectId(id) }, callback);
            };

            removeGoods = function(ids, callback) {
                var options = {
                    ids: ids,
                    dbName: db,
                    req: req
                };
                goodsOutNote.removeByOrder(options, callback);
            };

            updateFields = function(callback) {
                callback();
                updateOnlySelectedFields(req, res, next, id, data);
            };

            waterfallTasks = [getGoodsOutNotes, removeGoods, updateFields];
            async.waterfall(waterfallTasks, function() {

            });

            return false;
        }

        updateOnlySelectedFields(req, res, next, id, data);
    };

    this.bulkRemove = function(req, res, next) {
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var body = req.body || { ids: [] };
        var ids = body.ids;

        Order.remove({ _id: { $in: ids } }, function(err, removed) {
            if (err) {
                return next(err);
            }

            OrderRows.remove({ order: { $in: ids } }, function(err, docs) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(removed);
            });

        });
    };

    this.getByWorkflows = function(req, res, next) {
        var dbIndex = req.session.lastDb;
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var data = req.query;
        var forSales = data.forSales === 'true';
        var filter = data.filter || {};
        var match = filterMapper.mapFilter(filter, { contentType: orderCT });

        Order.aggregate([{
            $match: match
        }, {
            $match: {
                forSales: forSales
            }
        }, {
            $lookup: {
                from: 'workflows',
                localField: 'workflow',
                foreignField: '_id',
                as: 'workflow'
            }
        }, {
            $project: {
                sum: { $divide: ['$paymentInfo.total', '$currency.rate'] },
                workflow: { $arrayElemAt: ['$workflow', 0] },
                status: 1
            }
        }, {
            $group: {
                _id: '$workflow._id',
                total: { $sum: '$sum' },
                status: { $addToSet: '$status' },
                name: { $first: '$workflow.name' },
                count: { $sum: 1 }
            }
        }, {
            $project: {
                total: { $divide: ['$total', 100] },
                name: 1,
                count: 1,
                status: 1
            }
        }], function(err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });

    };

    this.importexcel = function(req, res, next) {
        var data = req.body;
        var file = req.files && req.files.file ? req.files.file : null;
        var Project = models.get(req.session.lastDb, 'building', buildingSchema);
        var Product = models.get(req.session.lastDb, 'Product', ProductSchema);
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var GoodsInNote = models.get(req.session.lastDb, 'GoodsInNote', GoodsInSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var Workflow = models.get(req.session.lastDb, 'workflow', WorkflowSchema);
        var Warehouse = models.get(req.session.lastDb, 'warehouse', WarehouseSchema);
        var userId = req.session.uId;
        var list = xlsx.parse(file.path);
        var tempResult = [];
        var error;
        var status = {
            allocateStatus: 'NOT',
            fulfillStatus: 'NOT',
            shippingStatus: 'NOT'

        };

        var excelName = req.params.id.search('.xlsx');

        if (excelName == -1) {
            var jsonfileName = '../uploads/exceljson/' + req.params.id.replace('.xls', '') + '.json';
        } else {
            var jsonfileName = '../uploads/exceljson/' + req.params.id.replace('.xlsx', '') + '.json';
        }

        var jsonFile = require(jsonfileName);

        function findAndReplaceId(callback) {

            if (list[0].data.length != 0) {
                list[0].data.shift();
            };

            var projectName = list[0].data[0][1];
            var warehouseName = list[0].data[0][3];
            var projectId;
            var warehouseId;

            Project.findOne({ name: projectName }, function(err, mod) {

                if (err) {
                    callback(err);
                } else {
                    if (mod) {
                        projectId = mod._id;
                        Warehouse.findOne({ name: warehouseName }, function(err, warehouseMod) {

                            if (err) {
                                callback(err);
                            } else {
                                if (warehouseMod) {
                                    warehouseId = warehouseMod._id;
                                    callback(null, projectId, warehouseId);

                                } else {
                                    error = new Error('仓库名称为 ' + warehouseName + ' 在数据库中不存在');
                                    error.status = 400;
                                    callback(error);
                                }
                            }
                        });

                    } else {
                        error = new Error('名称为 ' + projectName + ' 的工程在数据库中不存在');
                        error.status = 400;
                        callback(error);
                    }
                }
            });
        };

        function findWorkflow(projectId, warehouseId, callback) {
            Workflow.find({ status: "New", wId: "goodsPlan" })
                .exec(function(err, workflow) {
                    if (err) {
                        return waterfallCallback(err);
                    }

                    var para = {};
                    para.projectId = projectId;
                    para.warehouseId = warehouseId;
                    if (workflow.length == 0) {
                        error = new Error('领料计划没有对应的工作流状态！');
                        error.status = 400;
                        callback(error);
                    } else {
                        para.workflowId = workflow[0]._id;
                        callback(null, para);
                    }
                });
        };

        function checkProduct(para, callback) {
            var isDo = true;
            var noneProduct = '';
            var products = [];

            async.each(list, function(listObj, asyncCb1) {

                for (var i = 2; i < jsonFile.startLine; i++) {
                    listObj.data.shift();
                }

                async.eachSeries(listObj.data, function(tempObj, asyncCb2) {
                    if (tempObj[0] != null && tempObj[0] != '总计') {
                        var name = tempObj[jsonFile.name] ? tempObj[jsonFile.name] : '';
                        if (products.length != 0) {
                            var flag = true;
                            products.forEach(function(product) {
                                if (product.name == name) {
                                    flag = false;
                                }
                            });
                            if (flag == false) {
                                asyncCb2(null);
                            } else {
                                Product.findOne({ name: name }, function(err, mod) {
                                    if (err) {
                                        asyncCb2(err);
                                    }

                                    if (!mod) {
                                        isDo = false;
                                        noneProduct = noneProduct.concat(' ', name);
                                    } else {
                                        products.push(mod);
                                    }
                                    asyncCb2(null);
                                });
                            }
                        } else {
                            Product.findOne({ name: name }, function(err, mod) {
                                if (err) {
                                    asyncCb2(err);
                                }

                                if (!mod) {
                                    isDo = false;
                                    noneProduct = noneProduct.concat(' ', name);
                                } else {
                                    products.push(mod);
                                }
                                asyncCb2(null);
                            });
                        }
                    } else {
                        asyncCb2(null);
                    }
                }, function(err) {
                    if (err) {
                        asyncCb1(err);
                    } else {
                        asyncCb1(null)
                    }
                });
            }, function(err) {
                if (err) {
                    callback(err);
                } else {
                    if (isDo == false) {
                        error = new Error('材料基础库暂无' + noneProduct + '产品！');
                        error.status = 500;
                        callback(error);
                    } else {
                        para.products = products;
                        callback(null, para);
                    }
                }
            });
        };

        function getTotal(para, callback) {

            async.each(list, function(listObj, asyncCb) {

                var orderData = {
                    building: para.projectId,
                    workflow: para.workflowId,
                    warehouse: para.warehouseId
                }

                orderData.createdBy = {};

                orderData.createdBy.user = req.session.uId;

                var order = new Order(orderData);

                order.status = status;
                order.orderType = "goodsPlan";

                if (req.session.uId) {
                    order.createdBy.user = req.session.uId;
                    order.editedBy.user = req.session.uId;
                }

                order.save(function(err, result) {
                    if (err) {
                        asyncCb(err);
                    }

                    async.each(listObj.data, function(tempObj, asyncCb1) {
                        if (tempObj[0] != null && tempObj[0] != '总计') {
                            var xlsData = {};
                            var parameters = [];
                            var tempCode;
                            var productId;

                            var name = tempObj[jsonFile.name];
                            var quantity = tempObj[jsonFile.quantity];
                            var description = tempObj[jsonFile.description];

                            for (var key in jsonFile.fields_name) {
                                parameters.push({
                                    paraname: jsonFile.fields_name[key],
                                    value: tempObj[key]
                                });
                            }

                            async.each(para.products, function(inventory, asyncCb2) {
                                if (inventory.name == name) {
                                    productId = inventory._id;
                                    asyncCb2(null);
                                } else {
                                    asyncCb2(null);
                                }
                            }, function(err) {
                                if (err) {
                                    asyncCb1(err);
                                }

                                var orderRowsData = {
                                    product: productId,
                                    quantity: quantity,
                                    description: description,
                                    parameters: parameters,
                                    order: result._id,
                                    warehouse: para.warehouseId
                                }

                                var orderRows = new OrderRows(orderRowsData);
                                orderRows.save(function(err, rowsResult) {
                                    if (err) {
                                        return next(err);
                                    }
                                })
                                tempResult.push(orderRowsData);
                                asyncCb1(null, tempResult);
                            });
                        } else {
                            asyncCb1(null, tempResult);
                        }
                    }, function(err) {
                        if (err) {
                            asyncCb(err);
                        }
                        asyncCb(null, tempResult);
                    });
                });
            }, function(err) {
                if (err) {
                    callback(err);
                }
                callback(null, tempResult);
            });
        };

        async.waterfall([findAndReplaceId, findWorkflow, checkProduct, getTotal], function(err, excelResult) {

            if (err) {
                return next(err);
            }

            var response = {};

            response.data = excelResult;
            res.status(200).send(response);
        });

    };

    this.updateWorkflow = function(req, res, next) {
        var Workflow = models.get(req.session.lastDb, 'workflow', WorkflowSchema);
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var _id = req.body._id;

        Workflow.find({ status: "Cancelled", wId: "goodsPlan" })
            .exec(function(err, workflow) {
                if (err) {
                    return next(err);
                }
                Order.findByIdAndUpdate(_id, { workflow: workflow[0]._id }, { new: true }, function(err, order) {

                    if (err) {
                        return next(err);
                    }
                    res.status(200).send(order);

                });
            });
    };
    this.updateGoodsInNum = function(req, res, next) {

        var body = req.body;
        var orderId = body.order;
        var lastDb = req.session.lastDb || 'saas';
        var GoodsInNote = models.get(lastDb, 'GoodsInNote', GoodsInSchema);
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        body.data.forEach(function(elem, index) {
            Availability.findByIdAndUpdate(elem.paId, {
                    $pull: {
                        goodsInNotes: { goodsNoteId: objectId(elem.goodsInNoteId) }
                    }
                }, { new: true },
                function(err, aval) {
                    if (err)
                        console.log(err);
                    Availability.findByIdAndUpdate(elem.paId, {
                        $addToSet: {
                            goodsInNotes: {
                                goodsNoteId: objectId(elem.goodsInNoteId),
                                quantity: elem.goodsInOnHand
                            }
                        },
                    }, { new: true }, function(err, av) {

                        if (err) {
                            return next(err);
                        }

                    });
                });
        })
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        Order.update({ _id: orderId }, { status: body.status }, function(err, result) {
            if (err)
                return next(err);
            else
                res.status(200).send({ success: 'Allocated updated' });
        })
    };

    this.allocate = function(req, res, next) {
        var body = req.body;
        var Availability = models.get(req.session.lastDb, 'productsAvailability', AvailabilitySchema);
        var goodsAllocate = models.get(req.session.lastDb, 'goodsAllocate', goodsAllocateSchema);
        var orderId = body.order;
        var orderRowsData = [];
        body.data.forEach(function(elem, index) {
            var allocated;
            if (elem.newAllocated == 0)
                allocated = elem.oldAllocated;
            else
                allocated = elem.newAllocated;
            orderRowsData.push({
                orderRowId: elem.orderRowId,
                quantity: allocated,
            })
        });
        var goodsAllocateData = {
            order: orderId,
            orderRows: orderRowsData,
            user: req.session.uId,
        };
        var goodsAlloc = new goodsAllocate(goodsAllocateData);
        goodsAlloc.save(function(err, data) {
            if (err) {
                return next(err);
            } else {

                async.each(body.data, function(elem, eachCb) {

                    Availability.findByIdAndUpdate(elem.paId, {
                        $pull: {
                            orderRows: {
                                orderRowsId: objectId(elem.orderRowId)
                            }
                        }
                    }, { new: true }, function(err, aval) {;
                        if (err) {
                            return eachCb(err);
                        }
                        Availability.findByIdAndUpdate(elem.paId, {
                            $addToSet: {
                                orderRows: {
                                    orderRowId: elem.orderRowId,
                                    quantity: elem.newAllocated,
                                }
                            },
                            $inc: { onHand: elem.oldAllocated - elem.newAllocated }
                        }, { new: true }, function(err, av) {

                            if (err) {
                                return eachCb(err);
                            }
                            eachCb(null, av);
                        });
                    })

                }, function(err) {
                    if (err) {
                        return next(err);
                    }
                    var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
                    Order.update({ _id: orderId }, { status: body.status }, function(err, result) {
                        console.log(result);
                        if (err)
                            console.log(err)
                        else
                            res.status(200).send({ success: 'Allocated updated' });
                    })

                });
            }


        });


    };
};

module.exports = Module;