var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var shippingNoteSchema = mongoose.Schemas.shippingNote;
    var buildingContractSchema = mongoose.Schemas.buildingContract;
    var productSchema = mongoose.Schemas.Products;
    var barCodeSchema = mongoose.Schemas.barCode;
    var HistoryService = require('../services/history.js')(models);
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
    var async = require('async');

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var shippingNote = models.get(db, 'shippingNote', shippingNoteSchema);
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
        var contentType = data.contentType || 'shippingNote';
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

        shippingNote.aggregate([
            {
                $match: {
                    _type: 'shippingNote'
                }
            },
            {
                $lookup: {
                    from: 'GoodsNote',
                    localField: 'goodsOutNote',
                    foreignField: '_id',
                    as: 'goodsOutNote'
                }
            },
            {
                $project: {
                    goodsOutNote: {$arrayElemAt: ['$goodsOutNote', 0]},
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: {$add: [{$multiply: [{$year: '$shipDate'}, 10000]}, {$multiply: [{$month: '$shipDate'}, 100]}, {$dayOfMonth: '$shipDate'}]},
                    barCodes: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    area: 1,
                    price: 1
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
                    'goodsOutNote._id': '$goodsOutNote._id',
                    'goodsOutNote.load': '$goodsOutNote.load',
                    'goodsOutNote.unLoad': '$goodsOutNote.unLoad',
                    'goodsOutNote.order': '$goodsOutNote.order',
                    'goodsOutNote.name': '$goodsOutNote.name',
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    numOfBarCodes: {$size: '$barCodes'},
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    barCodes: 1,
                    area: 1,
                    price: 1
                }
            },
            {
                $lookup: {
                    from: 'Order',
                    localField: 'goodsOutNote.order',
                    foreignField: '_id',
                    as: 'goodsOutNote.order'
                }
            },
            {
                $project: {
                    'goodsOutNote._id': 1,
                    'goodsOutNote.load': 1,
                    'goodsOutNote.unLoad': 1,
                    'goodsOutNote.name': 1,
                    'goodsOutNote.order': {$arrayElemAt: ['$goodsOutNote.order', 0]},
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    numOfBarCodes: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    barCodes: 1,
                    area: 1,
                    price: 1
                }
            },
            {
                $lookup: {
                    from: 'building',
                    localField: 'goodsOutNote.order.building',
                    foreignField: '_id',
                    as: 'goodsOutNote.order.building'
                }
            },
            {
                $project: {
                    'goodsOutNote._id': 1,
                    'goodsOutNote.load': 1,
                    'goodsOutNote.unLoad': 1,
                    'goodsOutNote.name': 1,
                    'goodsOutNote.order.building': {$arrayElemAt: ['$goodsOutNote.order.building', 0]},
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    numOfBarCodes: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    barCodes: 1,
                    area: 1,
                    price: 1
                }
            },
            {
                $project: {
                    'goodsOutNote._id': 1,
                    'goodsOutNote.load': 1,
                    'goodsOutNote.unLoad': 1,
                    'goodsOutNote.name': 1,
                    projectName: '$goodsOutNote.order.building.name',
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    numOfBarCodes: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    barCodes: 1,
                    area: 1,
                    price: 1
                }
            },
            {
                $unwind: '$barCodes'
            },
            {
                $lookup: {
                    from: 'barCode',
                    localField: 'barCodes',
                    foreignField: '_id',
                    as: 'barCodes'
                }
            },
            {
                $project: {
                    'goodsOutNote._id': 1,
                    'goodsOutNote.load': 1,
                    'goodsOutNote.unLoad': 1,
                    'goodsOutNote.name': 1,
                    projectName: 1,
                    ID: 1,
                    trips: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    shipDate: 1,
                    datekey: 1,
                    numOfBarCodes: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    barCodes: {$arrayElemAt: ['$barCodes', 0]},
                    area: 1,
                    price: 1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    goodsOutNoteName: {$first: '$goodsOutNote.name'},
                    load: {$first: '$goodsOutNote.load'},
                    unLoad: {$first: '$goodsOutNote.unLoad'},
                    projectName: {$first: '$projectName'},
                    ID: {$first: '$ID'},
                    trips: {$first: '$trips'},
                    license: {$first: '$license'},
                    fee: {$first: '$fee'},
                    fee1: {$first: '$fee1'},
                    shipDate: {$first: '$shipDate'},
                    datekey: {$first: '$datekey'},
                    numOfBarCodes: {$first: '$numOfBarCodes'},
                    deliverMan: {$first: '$deliverMan'},
                    salesman: {$first: '$salesman'},
                    status: {$first: '$status'},
                    barCodes: {$push: '$barCodes'},
                    area: {$first: '$area'},
                    price: {$first: '$price'}
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
                    goodsOutNoteName: 1,
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
                    numOfBarCodes: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    barCodes: {$filter: {
                        input: '$barCodes',
                        as: 'item',
                        cond: {$eq: ['$$item.status', 'Cancelled']}
                    }}
                }
            },
            {
                $project: {
                    _id: 1,
                    area: 1,
                    price: 1,
                    goodsOutNoteName: 1,
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
                    numOfBarCodes: 1,
                    deliverMan: 1,
                    salesman: 1,
                    status: 1,
                    cancelNum: {$size: '$barCodes'}
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
                    goodsOutNoteName: '$root.goodsOutNoteName',
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
                    numOfBarCodes: '$root.numOfBarCodes',
                    deliverMan: '$root.deliverMan',
                    salesman: '$root.salesman',
                    status: '$root.status',
                    area: '$root.area',
                    price: '$root.price',
                    cancelNum: '$root.cancelNum'
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
        var shippingNote = models.get(db, 'shippingNote', shippingNoteSchema);
        var buildingContract = models.get(db, 'buildingContract', buildingContractSchema);
        var product = models.get(db, 'Products', productSchema);
        var _id = req.params._id;
        function classifyByProject(callback){
             shippingNote.aggregate([
                {
                    $match: {
                        _id: ObjectId(_id)
                    }
                },
                {
                    $project:{
                        barCodes: 1,
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
                        isReturn: 1
                    }
                },
                {
                    $unwind: '$barCodes'
                },
                {
                    $lookup: {
                        from: 'barCode',
                        localField: 'barCodes',
                        foreignField: '_id',
                        as: 'barCodes'
                    }
                },
                {
                    $project: {
                        barCodes: {$arrayElemAt: ['$barCodes', 0]},
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
                        isReturn: 1
                    }
                },
                {
                    $project: {
                        'barCodes._id': '$barCodes._id',
                        'barCodes.orderRowId': '$barCodes.orderRowId',
                        'barCodes.barId': '$barCodes.barId',
                        'barCodes.status': '$barCodes.status',
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
                        isReturn: 1
                    }
                },
                {
                    $lookup: {
                        from: 'aluveneerOrders',
                        localField: 'barCodes.orderRowId',
                        foreignField: '_id',
                        as: 'barCodes.orderRowId'
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
                        'barCodes._id': 1,
                        'barCodes.barId': 1,
                        'barCodes.status': 1,
                        aluOrder: {$arrayElemAt: ['$barCodes.orderRowId', 0]}
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
                        'barCodes._id': 1,
                        'barCodes.barId': 1,
                        'barCodes.status': 1,
                        'aluOrder.projectName': '$aluOrder.projectName',
                        'aluOrder.cgdh': '$aluOrder.cgdh',
                        'aluOrder.W': '$aluOrder.W',
                        'aluOrder.cjlhf': '$aluOrder.cjlhf',
                        'aluOrder.kc': '$aluOrder.kc',
                        'aluOrder.jgsh': '$aluOrder.jgsh',
                        'aluOrder.boardType': '$aluOrder.boardType',
                        'aluOrder.dj': '$aluOrder.dj',
                        'aluOrder.lbbh': '$aluOrder.lbbh',
                        'aluOrder.lbmc': '$aluOrder.lbmc',
                        'aluOrder.L1': '$aluOrder.L1',
                        'aluOrder.L2': '$aluOrder.L2',
                        'aluOrder.L3': '$aluOrder.L3',
                        'aluOrder.L4': '$aluOrder.L4',
                        'aluOrder.L5': '$aluOrder.L5',
                        'aluOrder.L6': '$aluOrder.L6',
                        'aluOrder.dkjjmj': '$aluOrder.dkjjmj',
                        'aluOrder.hfdj': '$aluOrder.hfdj',
                        'aluOrder.kcdj': '$aluOrder.kcdj'
                    }
                },
                {
                    $lookup: {
                        from: 'building',
                        localField: 'aluOrder.projectName',
                        foreignField: '_id',
                        as: 'aluOrder.projectName'
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
                        'barCodes._id': 1,
                        'barCodes.barId': 1,
                        'barCodes.status': 1,
                        'aluOrder.projectName': {$arrayElemAt: ['$aluOrder.projectName', 0]},
                        'aluOrder.cgdh': 1,
                        'aluOrder.W': 1,
                        'aluOrder.cjlhf': 1,
                        'aluOrder.kc': 1,
                        'aluOrder.jgsh': 1,
                        'aluOrder.boardType': 1,
                        'aluOrder.dj': 1,
                        'aluOrder.lbbh': 1,
                        'aluOrder.lbmc': 1,
                        'aluOrder.L1': 1,
                        'aluOrder.L2': 1,
                        'aluOrder.L3': 1,
                        'aluOrder.L4': 1,
                        'aluOrder.L5': 1,
                        'aluOrder.L6': 1,
                        'aluOrder.dkjjmj': 1,
                        'aluOrder.hfdj': 1,
                        'aluOrder.kcdj': 1
                    }
                },
                {
                    $group: {
                        _id: {projectId: '$aluOrder.projectName._id', projectName: '$aluOrder.projectName.name', cgdh: '$aluOrder.cgdh'},
                        root: {$push: '$$ROOT'},
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
            async.map(data, function(project, asyncCb){
                var item = {};
                item._id = project._id;
                item.orderRows = [];
                item.isReturn = project.isReturn;
                buildingContract
                .find({projectName: item._id.projectId})
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
                    async.eachSeries(project.root, function(sub, subCb){
                        var lbbh = sub.aluOrder.lbbh;
                        var lbmc = sub.aluOrder.lbmc;
                        var status = sub.barCodes.status;
                        sub.num = 1;
                        sub.cancelNum = 0;
                        if(!item.orderRows.length){
                            product.find({name: lbmc}, function(err, result){
                                if(err){
                                    subCb(err)
                                }
                                if(result.length){
                                    for(var i=0;i<result[0].parameter.length;i++){
                                        if(result[0].parameter[i].name == '厚度'){
                                            sub.thickness = result[0].parameter[i].value;
                                        }
                                    }
                                } 
                                if(status == 'Cancelled'){
                                    sub.cancelNum = 1;
                                }
                                item.orderRows.push(sub);
                                subCb();
                            })
                        }
                        else{
                            var flag = false;
                            for(var n=0; n<item.orderRows.length; n++){
                                if(item.orderRows[n].aluOrder.lbbh == lbbh){
                                    flag = true;
                                    item.orderRows[n].num ++;
                                    if(status == 'Cancelled'){
                                        item.orderRows[n].cancelNum ++;
                                    }
                                }
                            }
                            if(!flag){
                                product.find({name: lbmc}, function(err, result){
                                    if(err){
                                        subCb(err)
                                    }
                                    if(result.length){
                                        for(var i=0;i<result[0].parameter.length;i++){
                                            if(result[0].parameter[i].name == '厚度'){
                                                sub.thickness = result[0].parameter[i].value;
                                            }
                                        }
                                    }
                                    if(status == 'Cancelled'){
                                        sub.cancelNum = 1;
                                    }
                                    item.orderRows.push(sub);
                                    subCb();
                                })
                            }
                            else{
                                subCb();
                            }
                        }
                    }, function(err){
                        if(err){
                            asyncCb(err);
                        }
                        asyncCb(null, item);
                    })
                })
            }, function(err, result){
                if(err){
                    callback(err)
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
        var shippingNoteModel = models.get(db, 'shippingNote', shippingNoteSchema);
        var id = req.params._id;
        var data = req.body;
        shippingNoteModel.findByIdAndUpdate(id, data, {new: true}, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        })
    };

    this.confirm = function (req, res, next) {
        var db = req.session.lastDb;
        var id = req.params._id;
        var status = req.body.status;
        var barCode = models.get(db, 'barCode', barCodeSchema);
        var shippingNote = models.get(db, 'shippingNote', shippingNoteSchema);
        function updateBarCode(cb){
            shippingNote.findById(id, function(err, result){
                if(err){
                    cb(err)
                }
                var goodsOutNoteId = result.goodsOutNote;
                barCode.find({goodsOutNote: goodsOutNoteId, status: 'Progress'}, function(err, barCodes){
                    if(err){
                        cb(err)
                    }
                    async.each(barCodes, function(item, asyncCb){
                        barCode.findByIdAndUpdate(item._id, {status: 'New'}, function(err, result){
                            if(err){
                                asyncCb(err);
                            }
                            asyncCb()
                        })
                    }, function(err){
                        if(err){
                            cb(err)
                        }
                        cb()
                    })
                })
            })
            
        }

        function updateShippingNote(cb){
            var currentDbName = req.session ? req.session.lastDb : null;
            var db = currentDbName ? models.connection(currentDbName) : null;
            var date = new Date();
            var inDate = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;
            db.collection('settings').findOneAndUpdate({
                dbName: db.databaseName,
                name  : 'shippingNote',
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
                shippingNote.findByIdAndUpdate(id, {status: 'Done', ID: ID, shipDate: date}, {new: true}, function(err, result){
                    if(err){
                        cb(err)
                    }
                    cb()
                })
            })
            
        }

        if(!status){
            async.parallel([updateBarCode, updateShippingNote], function(err, result){
                if(err){
                    next(err)
                }
                res.status(200).send(result);
            })
        }
        else{
            shippingNote.findByIdAndUpdate(id, {status: 'Done'}, {new: true}, function(err, result){
                if(err){
                    next(err)
                }
                res.status(200).send(result);
            })
        }
        
    },

    this.bulkRemove = function (req, res, next){
        var shippingNoteModel = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
 
        async.each(ids, function(id, cb){
            shippingNoteModel.findByIdAndRemove(id, function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
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