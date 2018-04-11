var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var oemOutNoteSchema = mongoose.Schemas.oemOutNote;
    var buildingContractSchema = mongoose.Schemas.buildingContract;
    var productSchema = mongoose.Schemas.Products;
    var designRecSchema = mongoose.Schemas.designRec;
    var oemNoteSchema = mongoose.Schemas.oemNote;
    var HistoryService = require('../services/history.js')(models);
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
    var async = require('async');

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var oemOutNote = models.get(db, 'oemOutNote', oemOutNoteSchema);
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var keys;
        var parallelTasks;
        var filterObj = {};
        var optionsObject = [];
        var filter = data.filter || {};
        var startDate = filter.startDate.value;
        var endDate = filter.endDate.value;
        var contentType = data.contentType || '6';
        var filterMapper = new FilterMapper();

        if (filter) {
            delete filter.startDate;
            delete filter.endDate;
            filterObj = filterMapper.mapFilter(filter, contentType); // caseFilterOpp(filter);
        }
        optionsObject.push(filterObj);

        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'shipDate': -1};
        }

        var startKey = new Date(startDate);
        var endKey = new Date(endDate);
        startKey = startKey.getFullYear()*10000 + (startKey.getMonth()+ 1)*100 + startKey.getDate();
        endKey = endKey.getFullYear()*10000 + (endKey.getMonth()+ 1)*100 + endKey.getDate();

        oemOutNote.aggregate([
            {
                $match: {
                    _type: 'oemOutNote'
                }
            },
            {
                $lookup: {
                    from: 'GoodsNote',
                    localField: 'oemNote',
                    foreignField: '_id',
                    as: 'oemNote'
                }
            },
            {
                $project: {
                    oemNote: {$arrayElemAt: ['$oemNote', 0]},
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: {$add: [{$multiply: [{$year: '$shipDate'}, 10000]}, {$multiply: [{$month: '$shipDate'}, 100]}, {$dayOfMonth: '$shipDate'}]},
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    area: 1,
                    price: 1,
                    orderRows: 1,
                    totalQuantity: 1
                }
            },
            {
                $match: {
                    datekey: {
                        $lte: endKey,
                        $gte: startKey
                    }
                }
            },
            {
                $project: {
                    'oemNote._id': '$oemNote._id',
                    'oemNote.load': '$oemNote.load',
                    'oemNote.unLoad': '$oemNote.unLoad',
                    'oemNote.order': '$oemNote.order',
                    'oemNote.name': '$oemNote.name',
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    area: 1,
                    price: 1,
                    orderRows: 1,
                    totalQuantity: 1
                }
            },
            {
                $lookup: {
                    from: 'Order',
                    localField: 'oemNote.order',
                    foreignField: '_id',
                    as: 'oemNote.order'
                }
            },
            {
                $project: {
                    'oemNote._id': 1,
                    'oemNote.load': 1,
                    'oemNote.unLoad': 1,
                    'oemNote.name': 1,
                    'oemNote.order': {$arrayElemAt: ['$oemNote.order', 0]},
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    area: 1,
                    price: 1,
                    orderRows: 1,
                    totalQuantity: 1
                }
            },
            {
                $lookup: {
                    from: 'building',
                    localField: 'oemNote.order.building',
                    foreignField: '_id',
                    as: 'oemNote.order.building'
                }
            },
            {
                $project: {
                    'oemNote._id': 1,
                    'oemNote.load': 1,
                    'oemNote.unLoad': 1,
                    'oemNote.name': 1,
                    'oemNote.order.building': {$arrayElemAt: ['$oemNote.order.building', 0]},
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    area: 1,
                    price: 1,
                    orderRows: 1,
                    totalQuantity: 1
                }
            },
            {
                $project: {
                    'oemNote._id': 1,
                    'oemNote.load': 1,
                    'oemNote.unLoad': 1,
                    'oemNote.name': 1,
                    projectName: '$oemNote.order.building.name',
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    area: 1,
                    price: 1,
                    orderRows: 1,
                    totalQuantity: 1
                }
            },
            {
                $match: filterObj
            },
            {
                $project: {
                    _id: 1,
                    area: 1,
                    price: 1,
                    oemNoteName: '$oemNote.name',
                    load: '$oemNote.load',
                    unLoad: '$oemNote.unLoad',
                    projectName: 1,
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    orderRows: 1,
                    totalQuantity: 1
                }
            },
            {
                $unwind: '$orderRows'
            },
            {
                $lookup: {
                    from: 'orderRows',
                    localField: 'orderRows.orderRowId',
                    foreignField: '_id',
                    as: 'orderRows.orderRowId'
                }
            },
            {
               $project: {
                    _id: 1,
                    area: 1,
                    price: 1,
                    oemNoteName: 1,
                    load: 1,
                    unLoad: 1,
                    projectName: 1,
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    'orderRows.orderRowId': {$arrayElemAt: ['$orderRows.orderRowId', 0]},
                    'orderRows.quantity': 1,
                    'orderRows.unit': 1,
                    'orderRows.unitPrice': 1,
                    'orderRows.returnNum': 1,
                    totalQuantity: 1
               } 
            },
            {
                $project: {
                    _id: 1,
                    area: 1,
                    price: 1,
                    oemNoteName: 1,
                    load: 1,
                    unLoad: 1,
                    projectName: 1,
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    'orderRows.orderRowId._id': '$orderRows.orderRowId._id',
                    'orderRows.orderRowId.parameters': '$orderRows.orderRowId.parameters',
                    'orderRows.orderRowId.description': '$orderRows.orderRowId.description',
                    'orderRows.orderRowId.product': '$orderRows.orderRowId.product',
                    'orderRows.quantity': 1,
                    'orderRows.unit': 1,
                    'orderRows.unitPrice': 1,
                    'orderRows.returnNum': 1,
                    totalQuantity: 1
                }
            },
            {
                $lookup: {
                    from: 'Products',
                    localField: 'orderRows.orderRowId.product',
                    foreignField: '_id',
                    as: 'orderRows.product'
                }
            },
            {
                $project: {
                    _id: 1,
                    area: 1,
                    price: 1,
                    oemNoteName: 1,
                    load: 1,
                    unLoad: 1,
                    projectName: 1,
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    'orderRows.orderRowId._id': 1,
                    'orderRows.orderRowId.parameters': 1,
                    'orderRows.orderRowId.description': 1,
                    'orderRows.product': {$arrayElemAt: ['$orderRows.product', 0]},
                    'orderRows.quantity': 1,
                    'orderRows.unit': 1,
                    'orderRows.unitPrice': 1,
                    'orderRows.returnNum': 1,
                    totalQuantity: 1
                }
            },
            {
                $project: {
                    _id: 1,
                    area: 1,
                    price: 1,
                    oemNoteName: 1,
                    load: 1,
                    unLoad: 1,
                    projectName: 1,
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    'orderRows.orderRowId._id': 1,
                    'orderRows.orderRowId.parameters': 1,
                    'orderRows.orderRowId.description': 1,
                    'orderRows.productName': '$orderRows.product.name',
                    'orderRows.quantity': 1,
                    'orderRows.unit': 1,
                    'orderRows.unitPrice': 1,
                    'orderRows.returnNum': 1,
                    totalQuantity: 1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    area: {$first: '$area'},
                    price: {$first: '$price'},
                    oemNoteName: {$first: '$oemNoteName'},
                    load: {$first: '$load'},
                    unLoad: {$first: '$unLoad'},
                    projectName: {$first: '$projectName'},
                    ID: {$first: '$ID'},
                    trips: {$first: '$trips'},
                    license: {$first: '$license'},
                    fee: {$first: '$fee'},
                    fee1: {$first: '$fee1'},
                    shipDate: {$first: '$shipDate'},
                    datekey: {$first: '$datekey'},
                    deliverMan: {$first: '$deliverMan'},
                    salesman: {$first: '$salesman'},
                    status: {$first: '$status'},
                    orderRows: {$push: '$orderRows'},
                    totalQuantity: {$sum: '$orderRows.quantity'},
                    returnNum: {$sum: '$orderRows.returnNum'}
                }
            },
            {
                $group: {
                    _id: null,
                    total: {$sum: 1},
                    root: {$push: '$$ROOT'}
                }
            },
            {
                $unwind: '$root'
            },
            {
                $project: {
                    load: '$root.load',
                    unLoad: '$root.unLoad',
                    oemNoteName: '$root.oemNoteName',
                    projectName: '$root.projectName',
                    ID: '$root.ID',
                    trips: '$root.trips',
                    license: '$root.license',
                    fee: '$root.fee',
                    fee1: '$root.fee1',
                    shipDate: '$root.shipDate',
                    total: 1,
                    datekey: '$root.datekey',
                    _id: '$root._id',
                    deliverMan: '$root.deliverMan',
                    salesman: '$root.salesman',
                    status: '$root.status',
                    area: '$root.area',
                    price: '$root.price',
                    orderRows: '$root.orderRows',
                    totalQuantity: '$root.totalQuantity',
                    returnNum: '$root.returnNum'
                }
            },
            {
                $sort: sort
            }, {
                $skip: skip
            }, {
                $limit: limit
            }
            ], function(err, result){
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
            })
    };

    this.getById = function (req, res, next){
        var db = req.session.lastDb;
        var oemOutNote = models.get(db, 'oemOutNote', oemOutNoteSchema);
        var buildingContract = models.get(db, 'buildingContract', buildingContractSchema);
        var product = models.get(db, 'Products', productSchema);
        var designRecModel = models.get(db, 'designRec', designRecSchema);
        var _id = req.params._id;
        function classifyByProject(callback){
             oemOutNote.aggregate([
                {
                    $match: {
                        _id: ObjectId(_id)
                    }
                },
                {
                    $project:{
                        ID: 1,
                        trips: 1,
                        license: 1,
                        shipDate: 1,
                        fee: 1,
                        fee1: 1,
                        deliverMan: 1,
                        receiver: 1,
                        salesman: 1,
                        status: 1,
                        orderRows: 1,
                        isReturn: 1
                    }
                },
                {
                    $unwind: '$orderRows'
                },
                {
                    $lookup: {
                        from: 'orderRows',
                        localField: 'orderRows.orderRowId',
                        foreignField: '_id', 
                        as: 'orderRows.orderRowId'
                    }
                },
                {
                    $lookup: {
                        from: 'Products',
                        localField: 'orderRows.product',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        ID: 1,
                        trips: 1,
                        license: 1,
                        shipDate: 1,
                        fee: 1,
                        fee1: 1,
                        deliverMan: 1,
                        receiver: 1,
                        salesman: 1,
                        status: 1,
                        isReturn: 1,
                        'orderRows.orderRowId': {$arrayElemAt: ['$orderRows.orderRowId', 0]},
                        'orderRows.quantity': 1,
                        'orderRows.unit': 1,
                        'orderRows.unitPrice': 1,
                        'orderRows.cost': 1,
                        'orderRows.returnNum': 1,
                        product: {$arrayElemAt: ['$product', 0]}
                    }
                },
                {
                    $lookup: {
                        from: 'Order',
                        localField: 'orderRows.orderRowId.order',
                        foreignField: '_id',
                        as: 'order'
                    }
                },
                {
                    $project: {
                        ID: 1,
                        trips: 1,
                        license: 1,
                        shipDate: 1,
                        fee: 1,
                        fee1: 1,
                        deliverMan: 1,
                        receiver: 1,
                        salesman: 1,
                        status: 1,
                        isReturn: 1,
                        'orderRows.orderRowId': 1,
                        'orderRows.quantity': 1,
                        'orderRows.unit': 1,
                        'orderRows.unitPrice': 1,
                        'orderRows.cost': 1,
                        'orderRows.returnNum': 1,
                        order: {$arrayElemAt: ['$order', 0]},
                        productName: '$product.name'
                    }
                },
                {
                    $lookup: {
                        from: 'building',
                        localField: 'order.building',
                        foreignField: '_id',
                        as: 'order.building'
                    }
                },
                {
                    $project: {
                        ID: 1,
                        trips: 1,
                        license: 1,
                        shipDate: 1,
                        fee: 1,
                        fee1: 1,
                        deliverMan: 1,
                        receiver: 1,
                        salesman: 1,
                        status: 1,
                        isReturn: 1,
                        'orderRows.orderRowId': 1,
                        'orderRows.quantity': 1,
                        'orderRows.unit': 1,
                        'orderRows.unitPrice': 1,
                        'orderRows.cost': 1,
                        'orderRows.returnNum': 1,
                        'order.building': {$arrayElemAt: ['$order.building', 0]},
                        'order.externalId': 1,
                        productName: 1
                    }
                },
                {
                    $group: {
                        _id: {projectId: '$order.building._id', projectName: '$order.building.name', designRec: '$order.externalId'},
                        root: {$push: '$$ROOT'},
                        ID: {$first: '$ID'},
                        trips: {$first: '$trips'},
                        license: {$first: '$license'},
                        shipDate: {$first: '$shipDate'},
                        deliverMan: {$first: '$deliverMan'},
                        receiver: {$first: '$receiver'},
                        salesman: {$first: '$salesman'},
                        status: {$first: '$status'},
                        isReturn: {$first: '$isReturn'}
                    }
                }
                ],function(err, result){
                    if(err){
                        next(err);
                    }
                    callback(null, result);
                })
        }

        function classifyByOrderRow(data, callback){
            var classifyResult = [];
            async.map(data, function(item, asyncCb){
                var designRec = item._id.designRec;
                var projectId = item._id.projectId;
                designRecModel.findById(ObjectId(designRec), function(err, result){
                    if(err){
                        asyncCb(err)
                    }
                    item._id.designRec = result.orderNumber;
                    buildingContract
                        .find({projectName: projectId})
                        .populate('customer', 'name')
                        .exec(function(err, building){
                        if(err){
                            asyncCb(err)
                        }
                        if(building[0].customer && building[0].customer.name){
                            item.customer = building[0].customer.name.first+building[0].customer.name.last;
                        }
                        item.consignee = building[0].consignee || '';
                        item.buildingContractId = building[0].contractNum || '';
                        for(var j=0; j<item.root.length; j++){
                            for(var i=0; i<item.root[j].orderRows.orderRowId.parameters.length; i++){
                                if(item.root[j].orderRows.orderRowId.parameters[i].paraname == '型号'){
                                    item.root[j].orderRows.xh = item.root[j].orderRows.orderRowId.parameters[i].value;
                                }
                                if(item.root[j].orderRows.orderRowId.parameters[i].paraname == '色号'){
                                    item.root[j].orderRows.sh = item.root[j].orderRows.orderRowId.parameters[i].value;
                                }
                                if(item.root[j].orderRows.orderRowId.parameters[i].paraname == '单位喷涂面积（m2/m）'){
                                    item.root[j].orderRows.dwptmj = item.root[j].orderRows.orderRowId.parameters[i].value;
                                }
                                if(item.root[j].orderRows.orderRowId.parameters[i].paraname == '长度（mm）'){
                                    item.root[j].orderRows.cd = item.root[j].orderRows.orderRowId.parameters[i].value;
                                }
                                if(item.root[j].orderRows.orderRowId.parameters[i].paraname == '保护膜（mm）'){
                                    item.root[j].orderRows.bhm = item.root[j].orderRows.orderRowId.parameters[i].value;
                                }
                                if(item.root[j].orderRows.orderRowId.parameters[i].paraname == '副计量单价'){
                                    item.root[j].orderRows.fjldj = item.root[j].orderRows.orderRowId.parameters[i].value;
                                }
                            }
                        }
                        asyncCb(null, item);
                    })
                })
            }, function(err, result){
                if(err){
                    callback(err);
                }
                callback(null, result)
            })
        }

        async.waterfall([classifyByProject, classifyByOrderRow], function(err, result){
            if(err){
                next(err)
            }
            var response = {
                data: result,
                _id: _id
            }
            res.status(200).send(response);
        })
       
    }

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var oemOutNoteModel = models.get(db, 'oemOutNote', oemOutNoteSchema);
        var id = req.params._id;
        var data = req.body;
        var orderRows = data.orderRows;
        var totalQuantity = 0;
        for(var i=0; i<orderRows.length; i++){
            totalQuantity += parseInt(orderRows[i].quantity);
        }
        data.totalQuantity = totalQuantity;
        delete data.orderRows;

        function updateOrderRows(callback){
            oemOutNoteModel.findByIdAndUpdate(id, data, {new: true}, function(err, result){
                if(err){
                    return next(err);
                }
                async.each(orderRows, function(orderRow, cb){
                    oemOutNoteModel.update({'_id': id, 'orderRows.orderRowId': orderRow.orderRowId}, {'orderRows.$.quantity': orderRow.quantity}, function(err, result){
                        if(err){
                            cb(err)
                        }
                        cb();
                    })
                }, function(err){
                    if(err){
                        next(err)
                    }
                    callback(null, null);
                })
                
            })
        }

        function updateAreaPrice(data, callback){
            oemOutNoteModel.aggregate([
                {
                    $match: {
                        _id: ObjectId(id)
                    }
                },
                {
                    $unwind: '$orderRows'
                },
                {
                    $lookup: {
                        from: 'orderRows',
                        localField: 'orderRows.orderRowId',
                        foreignField: '_id',
                        as: 'orderRows.orderRowId'
                    }
                },
                {
                    $project: {
                        area: 1,
                        price: 1,
                        'orderRows.orderRowId': {$arrayElemAt: ['$orderRows.orderRowId', 0]},
                        'orderRows.unit': 1,
                        'orderRows.unitPrice': 1,
                        'orderRows.quantity': 1
                    }
                },
                {
                    $project: {
                        area: 1,
                        price: 1,
                        'orderRows.orderRowId.parameters': '$orderRows.orderRowId.parameters',
                        'orderRows.unit': 1,
                        'orderRows.unitPrice': 1,
                        'orderRows.quantity': 1
                    }
                }
            ], function(err, result){
                if(err){
                    callback(err)
                }
                if(result.length){
                    var price = 0;
                    var area = 0;
                    result.forEach(function(item, index){
                        area += item.orderRows.unit*item.orderRows.quantity;
                        var subPrice = item.orderRows.unit* item.orderRows.unitPrice* item.orderRows.quantity;
                        var fjldj = 0;
                        var bhm = 0;
                        for(var i=0; i<item.orderRows.orderRowId.parameters.length; i++){
                            if(item.orderRows.orderRowId.parameters[i].paraname == '副计量单价'){
                                fjldj = item.orderRows.orderRowId.parameters[i].value;
                            }
                            if(item.orderRows.orderRowId.parameters[i].paraname == '保护膜（mm）'){
                                bhm = item.orderRows.orderRowId.parameters[i].value/1000;
                            }
                        }
                        subPrice = subPrice + fjldj*bhm;
                        price += subPrice;
                    })
                    oemOutNoteModel.findByIdAndUpdate(id, {$set: {area: area, price: price}}, {new: true}, function(err, result){
                        if(err){
                            callback(err)
                        }
                        callback(null, result);
                    })
                }
            })
        }

        async.waterfall([updateOrderRows, updateAreaPrice], function(err, result){
            if(err){
                next(err)
            }
            res.status(200).send({success: 'OK'})
        })
        
    };

    this.confirm = function (req, res, next) {
        var db = req.session.lastDb;
        var id = req.params._id;
        var status = req.body.status;
        var oemOutNote = models.get(db, 'oemOutNote', oemOutNoteSchema);
        var oemNote = models.get(db, 'oemNote', oemNoteSchema);

        function updateShippingNote(cb){
            var currentDbName = req.session ? req.session.lastDb : null;
            var db = currentDbName ? models.connection(currentDbName) : null;
            var date = new Date();
            var inDate = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;
            db.collection('settings').findOneAndUpdate({
                dbName: db.databaseName,
                name  : 'oemOutNote',
                inDate  : inDate
            },{
                $inc: {seq: 1}
            }, {
                returnOriginal: false,
                upsert        : true
            }, function(err, rate){
                if(err){
                    cb(err)
                }
                var ID = inDate.toString() + rate.value.seq.toString();
                oemOutNote.findByIdAndUpdate(id, {status: 'Done', ID: ID, shipDate: date}, {new: true}, function(err, result){
                    if(err){
                        cb(err)
                    }
                    cb(null, result)
                })
            })
            
        }

        function updateOemNote(oemOutNote, cb){
            var oemNoteId = oemOutNote.oemNote;
            var orderRows = oemOutNote.orderRows;
            oemNote.findById(oemNoteId, function(err, result){
                var preOrderRows = result.orderRows;
                preOrderRows.forEach(function(item, index){
                    orderRows.forEach(function(sub, index2){
                        if(sub.orderRowId.toString() == item.orderRowId.toString()){
                            item.quantity = sub.quantity;
                        }
                    })
                })
                oemNote.findByIdAndUpdate(oemNoteId, {$set: {orderRows: preOrderRows}}, function(err, result){
                    if(err){
                        cb(err)
                    }
                    cb()
                })
            });
        }

        if(!status){
            async.waterfall([updateShippingNote, updateOemNote], function(err, result){
                if(err){
                    next(err)
                }
                res.status(200).send({success: 'OK'});
            })
        }
        else{
            oemOutNote.findByIdAndUpdate(id, {status: 'Done'}, {new: true}, function(err, result){
                if(err){
                    next(err)
                }
                res.status(200).send({success: 'OK'});
            })
        }
        
    },

    this.bulkRemove = function (req, res, next){
        var oemOutNoteModel = models.get(req.session.lastDb, 'oemOutNote', oemOutNoteSchema);
        var oemNote = models.get(req.session.lastDb, 'oemNote', oemNoteSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
 
        async.each(ids, function(id, cb){
            oemOutNoteModel.findByIdAndRemove(id, function(err, result){
                if(err){
                    return cb(err);
                }
                oemNote.findByIdAndUpdate(result.oemNote, {$set: {"status.approved": false}}, {new: true}, function(err, result){
                    if(err){
                        cb(err)
                    }
                    cb(null, result);
                })
                
            });
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send({success: 'success'});
        });
    }

};
module.exports = Module;
