var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var writeOffsSchema = mongoose.Schemas.WriteOffs;
var stockReturnSchema = mongoose.Schemas.stockReturns;
var barCodeSchema = mongoose.Schemas.barCode;
var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
var workCentreSchema = mongoose.Schemas.workCentre;
var OrderSchema = mongoose.Schemas.Order;
var OrderRowsSchema = mongoose.Schemas.OrderRow;
var oemOutNoteSchema = mongoose.Schemas.oemOutNote;
var objectId = mongoose.Types.ObjectId;
var _ = require('lodash');
var async = require('async');

var Module = function (models, event) {
    'use strict';

    var validator = require('../helpers/validator');

    var fs = require('fs');
    var path = require('path');
    var Uploader = require('../services/fileStorage/index');
    var pageHelper = require('../helpers/pageHelper');
    var uploader = new Uploader();
    var FilterMapper = require('../helpers/filterMapper');
    var HistoryService = require('../services/history.js')(models);

    this.createOemBarcode = function (req, res, next) {
        var body = req.body;
        var id = body.writeOffsId;
        var writeOff;
        var error;
        var WriteOffsModel = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var oemOutNoteModel = models.get(req.session.lastDb, 'oemOutNote', oemOutNoteSchema);
        var currentDbName = req.session ? req.session.lastDb : null;
        var db = currentDbName ? models.connection(currentDbName) : null;
        var date = new Date();
        var inDate = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;
        async.eachSeries(body.oemOrder, function (oemOrder, cb) {
            WriteOffsModel.findByIdAndUpdate(id, {$addToSet: {'oemOrder': oemOrder}}, {new: true}, function(err, writeOffsResult){
                if(err){
                    return next(err);
                }

                oemOutNoteModel.findOneAndUpdate({_id: writeOffsResult.deliverNumber, 'orderRows.orderRowId': oemOrder.orderRowId}, {'orderRows.$.returnNum': oemOrder.quantity}, {new: true} ,function (err, oemOutNoteResult) {
                    if (err) {
                        return err(err);
                    }
                    console.log(id);

                    oemOutNoteModel.find({writeOffs : objectId(id)} ,function (err, oemOutResult) {
                        if (err) {
                            return err(err);
                        }

                        if(oemOutResult.length > 0){
                            var tempOrderRows = {};
                            for(var i = 0;i<oemOutNoteResult.orderRows.length;i++){
                                if(oemOutNoteResult.orderRows[i].orderRowId==oemOrder.orderRowId){
                                    tempOrderRows = oemOutNoteResult.orderRows[i];
                                    tempOrderRows.quantity = oemOrder.quantity;
                                }
                            }

                            oemOutNoteModel.update({writeOffs : id , isReturn : true}, {$push: {'orderRows' : tempOrderRows}, $inc:{area: tempOrderRows.unit*tempOrderRows.quantity}}, {new: true}, function(err, oemOutResult) {

                                if (err) {
                                    return next(err);
                                }

                                cb();
                            });
                        }
                        else{
                            db.collection('settings').findOneAndUpdate({
                                dbName: db.databaseName,
                                name  : 'oemOutNoteReturn',
                                inDate  : inDate
                            },{
                                $inc: {seq: 1}
                            },{
                                returnOriginal: false,
                                upsert        : true
                            },function(err, rate){
                                if(err){
                                    cb(err)
                                }

                                var tempOrderRows = {};
                                for(var i = 0;i<oemOutNoteResult.orderRows.length;i++){
                                    if(oemOutNoteResult.orderRows[i].orderRowId==oemOrder.orderRowId){
                                        tempOrderRows = oemOutNoteResult.orderRows[i];
                                        tempOrderRows.quantity = oemOrder.quantity;
                                    }
                                }

                                var ID = 'TH' + inDate.toString() + rate.value.seq.toString();
                                
                                var data = {
                                    ID : ID,
                                    shipDate : date,
                                    isReturn : true,
                                    oemNote : oemOutNoteResult.oemNote,
                                    writeOffs : objectId(id),
                                    area     : tempOrderRows.unit*tempOrderRows.quantity,
                                    //price    : -barCodeResult.orderRowId.totalPrice,
                                    orderRows: [tempOrderRows]
                                };

                                var newOemOutNote = new oemOutNoteModel(data);
                                newOemOutNote.save(function (err, result) {
                                    if (err) {
                                        return next(err);
                                    }
                                    cb();
                                });

                            });
                        }
                    });
                });
            });
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: true});
        });
        
    };

    this.oemBarcodeUpdate = function (req, res, next) {
        var WriteOffsSchema = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        
        WriteOffsSchema.update({'_id':data.writeOffsId, 'oemOrder.orderRowId': _id}, {'oemOrder.$.handlOpinion': data.handlOpinion}, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.allOpinionUpdate = function (req, res, next) {
        var WriteOffsSchema = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            WriteOffsSchema.update({'_id':body.writeOffsId, 'oemOrder.orderRowId': id}, {'oemOrder.$.handlOpinion': body.handlOpinion}, function (err, writeOff) {
                if (err) {
                    return err(err);
                }

                cb();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: true});
        });
    };

    this.getByViewType = function (req, res, next) {
        var data=req.query;
        var viewType = req.query.viewType;

        if(data.id && viewType=='list'){
            getForm(req, res, next);
        } 
        else{
            getList(req, res, next);
        }
    };

    function getList(req, res, next) {
        var WriteOffsSchema = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
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
        var contentType = data.contentType || 'oemBarcode';
        var filterMapper = new FilterMapper();

        if (filter) {
            filterObj = filterMapper.mapFilter(filter, contentType); // caseFilterOpp(filter);
        }

        optionsObject.push(filterObj);
        
        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'projectId': -1};
        }   

        WriteOffsSchema.aggregate([     

            {
                $lookup: {
                    from        : 'building',
                    localField  : 'projectId',
                    foreignField: '_id',
                    as          : 'projectId'
                }
            },
            {
                $lookup: {
                    from        : 'shippingNote',
                    localField  : 'deliverNumber',
                    foreignField: '_id',
                    as          : 'deliverNumber'
                }
            },
            {
                $lookup: {
                    from        : 'Users',
                    localField  : 'createdBy.user',
                    foreignField: '_id',
                    as          : 'createdBy.user'
                }
            }, 
            {
                $lookup: {
                    from        : 'Users',
                    localField  : 'editedBy.user',
                    foreignField: '_id',
                    as          : 'editedBy.user'
                }
            },
            {
                $project: {
                    projectId       : {$arrayElemAt: ['$projectId', 0]},
                    orderNumber     : 1,
                    deliverNumber   : {$arrayElemAt: ['$deliverNumber', 0]},
                    reason          : 1,
                    quantity        : 1,
                    type            : 1,
                    state           : 1,
                    'createdBy.user' : {$arrayElemAt: ['$createdBy.user', 0]},
                    'createdBy.date' : 1,
                }
            }, 
            {
                $match: {
                    type : 'oemReturn'
                }
            },
            {
                $match: {
                    $and: optionsObject
                }
            }, 
            {
                $group: {
                    _id  : null,
                    total: {$sum: 1},
                    root : {$push: '$$ROOT'}
                }
            },
            {
                $unwind: '$root'
            },
            {
                $project: {
                    _id             : '$root._id',
                    projectId       : '$root.projectId',
                    orderNumber     : '$root.orderNumber',
                    deliverNumber   : '$root.deliverNumber',
                    reason          : '$root.reason',
                    quantity        : '$root.quantity',
                    type            : '$root.type',
                    state           : '$root.state',
                    'createdBy.user'   : '$root.createdBy.user.login',
                    'createdBy.date'   : '$root.createdBy.date',
                    total           : 1
                }
            },
            {
                $sort: sort
            },
            {
                $skip: skip
            }, 
            {
                $limit: limit
            }
            ],function (err, result) {
                var count;
                var response = {};

                if (err) {
                    return next(err);
                }

                count = result[0] && result[0].total ? result[0].total : 0;               

                response.total = count;
                response.data = result;

                res.status(200).send(response);
        });

    };

    function getForm(req, res, next) {
        var WriteOffsSchema = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var barCodeSchema = models.get(req.session.lastDb, 'barCode', barCodeSchema);
        var AluveneerOrdersSchema = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var id = req.query.id;
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
        var contentType = data.contentType || 'oemBarcode';
        var filterMapper = new FilterMapper();

        if (filter) {
            filterObj = filterMapper.mapFilter(filter, contentType); // caseFilterOpp(filter);
        }

        optionsObject.push(filterObj);
        
        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'barId': -1};
        }

        function writeOffsList(callback){
 
            WriteOffsSchema.find({

                _id: objectId(id)

            }, 
            {
                'barCode'      : 1,
                'oemOrder'     : 1,
                projectId      : 1,
                orderNumber    : 1,
                'createdBy'    : 1,
                'editedBy'     : 1
            })
            .populate('barCode.barId')
            .populate('oemOrder.orderRowId')
            //.populate('oemOrder.product')
            .populate('projectId')
            .populate('createdBy.user')
            .populate('editedBy.user')
            .exec(function (err, tempData) {
                if (err) {
                    return next(err);
                }

                callback(null, tempData);

            });

        };

        function replaceOemOrder(tempData, callback){
            var replaceData;
            async.map(tempData, function (temp, cb1) {
                if(temp != ''){
                    
                    async.map(temp.oemOrder, function (oemOrder, cb2) {
                        if(oemOrder != ''){
                            var tempOemOrder = {};

                            tempOemOrder.projectId = tempData[0].projectId;
                            tempOemOrder.orderNumber = tempData[0].orderNumber;
                            tempOemOrder._id = oemOrder.orderRowId._id;
                            tempOemOrder.orderRowId = oemOrder.orderRowId;
                            tempOemOrder.product = oemOrder.product;
                            tempOemOrder.quantity = oemOrder.quantity;
                            tempOemOrder.wareOpinion = oemOrder.wareOpinion;
                            tempOemOrder.handlOpinion = oemOrder.handlOpinion;
                            
                            cb2(null, tempOemOrder);
                        }
                        else{
                            cb2(null, false);
                        }

                    }, function (err, oemOrderData) {
                        if (err) {
                            return next(err);
                        } 
                        
                        cb1(null, oemOrderData);

                    });

                }
                else{
                    cb1(null, false);
                }
      

            }, function (err, replaceData) {
                if (err) {
                    return next(err);
                }
                replaceData = _.flatten(replaceData);
                callback(null, replaceData);

            });
            
        };

        async.waterfall([writeOffsList, replaceOemOrder], function(err, finalResult){

            if(err){
                return next(err);
            }

            var response = {};

            if (err) {
                return next(err);
            }

            if(finalResult.length == 0){
                response.data = [];
                response.total = 0;
            }
            else{
                response.data = finalResult;
                response.total = finalResult.length;
            }
           
            res.status(200).send(response);
        });

    };

    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.update({'_id':body.writeOffsId}, {$pull: { 'oemOrder': { orderRowId : id }}}, function (err, writeOff) {
                if (err) {
                    return err(err);
                }

                cb();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: true});
        });
    };

    this.getByWriteOff = function(req, res, next) {
        var ids = req.query.ids || req.params.ids;
        var WriteOffs = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var arr = [];
        
        async.map(ids, function(id, cb) {

            var writeOffsSearcher = function (waterfallCallback) {
                WriteOffs.aggregate([
                    {
                        $match: {
                            _id: objectId(id)
                        }
                    },
                    {
                        $lookup: {
                            from        : 'building',
                            localField  : 'projectId',
                            foreignField: '_id',
                            as          : 'projectId'
                        }
                    },
                    {
                        $lookup: {
                            from        : 'shippingNote',
                            localField  : 'deliverNumber',
                            foreignField: '_id',
                            as          : 'deliverNumber'
                        }
                    },
                    {
                        $lookup: {
                            from        : 'Users',
                            localField  : 'createdBy.user',
                            foreignField: '_id',
                            as          : 'createdBy.user'
                        }
                    },
                    {
                        $lookup: {
                            from        : 'Users',
                            localField  : 'editedBy.user',
                            foreignField: '_id',
                            as          : 'editedBy.user'
                        }
                    },
                    {
                        $project: {
                            projectId       : {$arrayElemAt: ['$projectId', 0]},
                            deliverNumber   : {$arrayElemAt: ['$deliverNumber', 0]},
                            barCode         : 1,
                            oemOrder        : 1,
                            orderNumber     : 1,
                            quantity        : 1,
                            reason          : 1,
                            type            : 1,
                            state           : 1,
                            'createdBy.user'  : {$arrayElemAt: ['$createdBy.user', 0]},
                            'editedBy.user'   : {$arrayElemAt: ['$editedBy.user', 0]},
                        }
                    },
                    {
                        $unwind: '$deliverNumber.orderRows'
                    },
                    {
                        $lookup: {
                            from        : 'Products',
                            localField  : 'deliverNumber.orderRows.product',
                            foreignField: '_id',
                            as          : 'product'
                        }
                    },
                    {
                        $lookup: {
                            from        : 'orderRows',
                            localField  : 'deliverNumber.orderRows.orderRowId',
                            foreignField: '_id',
                            as          : 'orderRowId'
                        }
                    },
                    {
                        $project: {
                            product          : {$arrayElemAt: ['$product', 0]},
                            orderRowId       : {$arrayElemAt: ['$orderRowId', 0]},
                            quantity         : '$deliverNumber.orderRows.quantity',
                            _type            : '$deliverNumber._type',
                            shipDate         : '$deliverNumber.shipDate',
                            area             : '$deliverNumber.area',
                            price            : '$deliverNumber.price',
                            isReturn         : '$deliverNumber.isReturn',
                            license          : '$deliverNumber.license',
                            trips            : '$deliverNumber.trips',
                            deliverMan       : '$deliverNumber.deliverMan',
                            salesman         : '$deliverNumber.salesman',
                            projectId        : 1,
                            barCode          : 1,
                            oemOrder         : 1,
                            orderNumber      : 1,
                            quantity         : 1,
                            reason           : 1,
                            type             : 1,
                            state            : 1,
                            createdBy        : 1,
                            editedBy         : 1
                        }
                    },
                    {
                        $lookup: {
                            from        : 'Order',
                            localField  : 'orderRowId.order',
                            foreignField: '_id',
                            as          : 'order'
                        }
                    },
                    {
                        $project: {
                            product          : 1,
                            orderRowId       : 1,
                            order            : {$arrayElemAt: ['$order', 0]},
                            quantity         : 1,
                            _type            : 1,
                            shipDate         : 1,
                            area             : 1,
                            price            : 1,
                            isReturn         : 1,
                            license          : 1,
                            trips            : 1,
                            deliverMan       : 1,
                            salesman         : 1,
                            projectId        : 1,
                            barCode          : 1,
                            oemOrder         : 1,
                            orderNumber      : 1,
                            quantity         : 1,
                            reason           : 1,
                            type             : 1,
                            state            : 1,
                            createdBy        : 1,
                            editedBy         : 1
                        }
                    },
                    {
                        $group: {
                            _id       : '$_id',
                            products: {
                                $push: {
                                    _id              : '$orderRowId._id',
                                    productName      : '$product.name',
                                    quantity         : '$quantity',
                                    description      : '$orderRowId.description',
                                    parameters       : '$orderRowId.parameters',
                                }
                            },
                            name            : {$first: '$order.name'},
                            _type           : {$first: '$_type'},
                            shipDate        : {$first: '$shipDate'},
                            area            : {$first: '$area'},
                            price           : {$first: '$price'},
                            isReturn        : {$first: '$isReturn'},
                            license         : {$first: '$license'},
                            trips           : {$first: '$trips'},
                            deliverMan      : {$first: '$deliverMan'},
                            projectId       : {$first: '$projectId'},
                            salesman        : {$first: '$salesman'},
                            barCode         : {$first: '$barCode'},
                            oemOrder        : {$first: '$oemOrder'},
                            orderNumber     : {$first: '$orderNumber'},
                            quantity        : {$first: '$quantity'},
                            reason          : {$first: '$reason'},
                            type            : {$first: '$type'},
                            state           : {$first: '$state'},
                            createdBy       : {$first: '$createdBy'},
                            editedBy        : {$first: '$editedBy'}
                        }
                    },
                    {
                        $group: {
                            _id  : null,
                            total: {$sum: 1},
                            root : {$push: '$$ROOT'}
                        }
                    },
                    {
                        $unwind: '$root'
                    },
                    {
                        $project: {
                            _id             : '$root._id',
                            products        : '$root.products',
                            name            : '$root.name',
                            _type           : '$root._type',
                            shipDate        : '$root.shipDate',
                            area            : '$root.area',
                            price           : '$root.price',
                            isReturn        : '$root.isReturn',
                            license         : '$root.license',
                            trips           : '$root.trips',
                            deliverMan      : '$root.deliverMan',
                            projectId       : '$root.projectId',
                            salesman        : '$root.salesman',
                            barCode         : '$root.barCode',
                            oemOrder        : '$root.oemOrder',
                            orderNumber     : '$root.orderNumber',
                            quantity        : '$root.quantity',
                            reason          : '$root.reason',
                            type            : '$root.type',
                            state           : '$root.state',
                            createdBy       : '$root.createdBy',
                            editedBy        : '$root.editedBy',
                            total           : 1
                        }
                    }
                    ],function (err, result) {
                        var count;
                        var response = {};

                        if (err) {
                            return next(err);
                        }

                        response = result;

                        res.status(200).send(response);
                });
            };

            var waterfallTasks = [writeOffsSearcher];

            async.waterfall(waterfallTasks, function (err, result) {

                if (err) {
                    return next(err);
                }

                arr.push(result);
                cb(null,result);

            });

        }, function(err){
            if (err) {
                return next(err);
            }
            res.status(200).send(arr);
        });
    };

};

module.exports = Module;
