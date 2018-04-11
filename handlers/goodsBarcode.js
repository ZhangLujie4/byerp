var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var writeOffsSchema = mongoose.Schemas.WriteOffs;
var stockReturnSchema = mongoose.Schemas.stockReturns;
var barCodeSchema = mongoose.Schemas.barCode;
var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
var workCentreSchema = mongoose.Schemas.workCentre;
var shippingNoteSchema = mongoose.Schemas.shippingNote;
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

    this.createGoodsBarcode = function (req, res, next) {
        var body = req.body;
        var id = body.writeOffsId;
        var writeOff;
        var error;
        var WriteOffsModel = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var BarCodeModel = models.get(req.session.lastDb, 'barCode', barCodeSchema);
        var ShippingNoteModel = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);
        var currentDbName = req.session ? req.session.lastDb : null;
        var db = currentDbName ? models.connection(currentDbName) : null;
        var date = new Date();
        var inDate = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;

        delete body.writeOffsId;

        WriteOffsModel.findByIdAndUpdate(id, {$addToSet: {'barCode': body}}, {new: true}, function(err, writeOffsResult){
            if(err){
                return next(err);
            }

            BarCodeModel.findByIdAndUpdate(body.barId, {$set: {status: 'Cancelled'}}, {new: true})
                .populate('orderRowId', 'dkjjmj totalPrice')
                .exec(function(err, barCodeResult){
                    if(err){
                        return next(err);
                    }

                    ShippingNoteModel.find({writeOffs : id} ,function (err, shippingNote) {
                        if (err) {
                            return err(err);
                        }

                        if(shippingNote.length > 0){
                            ShippingNoteModel.update({writeOffs : id , isReturn : true}, {$addToSet: {'barCodes' : objectId(body.barId)}, $inc:{area: barCodeResult.orderRowId.dkjjmj, price: -barCodeResult.orderRowId.totalPrice}}, {new: true}, function(err, shippingResult) {

                                if (err) {
                                    return next(err);
                                }

                                res.status(200).send(shippingResult);
                            });
                        }
                        else{
                            db.collection('settings').findOneAndUpdate({
                                dbName: db.databaseName,
                                name  : 'shippingNoteReturn',
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

                                var ID = 'TH' + inDate.toString() + rate.value.seq.toString();
                                var barCodes = [];
                                barCodes[0] = objectId(body.barId);
                                
                                var data = {
                                    ID : ID,
                                    shipDate : date,
                                    isReturn : true,
                                    barCodes : barCodes,
                                    goodsOutNote : barCodeResult.goodsOutNote,
                                    writeOffs : objectId(id),
                                    area     : barCodeResult.orderRowId.dkjjmj,
                                    price    : -barCodeResult.orderRowId.totalPrice
                                };

                                var newShipping = new ShippingNoteModel(data);
                                newShipping.save(function (err, result) {
                                    if (err) {
                                        return next(err);
                                    }
                                    res.status(200).send(result);
                                });

                            });
                        }
                    });

                });

        });
        
    };


    this.goodsBarcodeUpdate = function (req, res, next) {
        var WriteOffsSchema = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        
        WriteOffsSchema.update({'_id':data.writeOffsId, 'barCode.barId': _id}, {'barCode.$.handlOpinion': data.handlOpinion}, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        })
    };

    this.allOpinionUpdate = function (req, res, next) {
        var WriteOffsSchema = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            WriteOffsSchema.update({'_id':body.writeOffsId, 'barCode.barId': id}, {'barCode.$.handlOpinion': body.handlOpinion}, function (err, writeOff) {
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
        var contentType = data.contentType || 'goodsBarcode';
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
                    isGoodsPlan     : 1,
                    'createdBy.user' : {$arrayElemAt: ['$createdBy.user', 0]},
                    'createdBy.date' : 1,
                }
            }, 
            {
                $match: {
                    type : 'goodsReturn'
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
                    isGoodsPlan     : '$root.isGoodsPlan',
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
        var contentType = data.contentType || 'goodsBarcode';
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
                projectId      : 1,
                orderNumber    : 1,
                'createdBy'    : 1,
                'editedBy'     : 1
            })
            .populate('barCode.barId')
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

        function replaceBarcode(tempData, callback){
            var replaceData;
            async.map(tempData, function (temp, cb1) {
                if(temp != ''){
                    
                    async.map(temp.barCode, function (barCode, cb2) {
                        if(barCode != ''){
                            var tempBarcode = {};

                            tempBarcode.projectId = tempData[0].projectId;
                            tempBarcode.orderNumber = tempData[0].orderNumber;
                            tempBarcode._id = barCode.barId._id;
                            tempBarcode.barId = barCode.barId.barId;
                            tempBarcode.curWorkCentre = barCode.barId.curWorkCentre;
                            tempBarcode.orderRowId = barCode.barId.orderRowId;
                            tempBarcode.wareOpinion = barCode.wareOpinion;
                            tempBarcode.handlOpinion = barCode.handlOpinion;
                            
                            cb2(null, tempBarcode);
                        }
                        else{
                            cb2(null, false);
                        }

                    }, function (err, barCodeData) {
                        if (err) {
                            return next(err);
                        } 
                        
                        cb1(null, barCodeData);

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

        function replaceOrderRowId(replaceData, callback){

            async.map(replaceData, function (replaceTemp, cb) {
                if(replaceTemp != ''){
                    var tempAluorders = {};

                    AluveneerOrdersSchema.findOne({_id : replaceTemp.orderRowId}, function (err, aluveneer) {

                        if (err) {
                            console.log(err);
                        } else {
                            if (aluveneer) {

                                tempAluorders.lbmc = aluveneer.lbmc;
                                tempAluorders.lbbh = aluveneer.lbbh;
                                tempAluorders.sfyx = aluveneer.sfyx;
                                tempAluorders.sqm  = aluveneer.sqm;
                                tempAluorders.szjys = aluveneer.szjys;
                                tempAluorders.cjlhf = aluveneer.cjlhf;
                                tempAluorders.kc = aluveneer.kc;
                                tempAluorders.W = aluveneer.W;
                                tempAluorders.L1 = aluveneer.L1;
                                tempAluorders.L2 = aluveneer.L2;
                                tempAluorders.L3 = aluveneer.L3;
                                tempAluorders.L4 = aluveneer.L4;
                                tempAluorders.L5 = aluveneer.L5;
                                tempAluorders.L6 = aluveneer.L6;
                                tempAluorders.dkjjmj = aluveneer.dkjjmj;
                                tempAluorders.jgsh = aluveneer.jgsh;
                                tempAluorders.jgth = aluveneer.jgth;

                                replaceTemp.orderRowId = tempAluorders;
                                
                                cb(null, replaceTemp);
                               
                            } else {
                                error = new Error('不存在对应的退货板');
                                error.status = 400;
                                cb(error);
                            }
                        }
                    });
                    
                }
                else{
                    cb(null, false);
                }

            }, function (err, aluData) {
                if (err) {
                    return next(err);
                } 
                
                callback(null, aluData);

            });          

        };

        async.waterfall([writeOffsList, replaceBarcode, replaceOrderRowId], function(err, finalResult){

            if(err){
                return next(err);
            }

            var response = {};

            if (err) {
                return next(err);
            }

            response.data = finalResult;
            response.total = finalResult.length;
           
            res.status(200).send(response);
        });

    };

    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.update({'_id':body.writeOffsId}, {$pull: { 'barCode': { barId : id }}}, function (err, writeOff) {
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

};

module.exports = Module;
