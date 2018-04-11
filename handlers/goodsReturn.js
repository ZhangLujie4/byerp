var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var writeOffsSchema = mongoose.Schemas.WriteOffs;
var stockReturnSchema = mongoose.Schemas.stockReturns;
var barCodeSchema = mongoose.Schemas.barCode;
var OrderSchema = mongoose.Schemas.Order;
var oemNoteSchema = mongoose.Schemas.oemNote;
var shippingNoteSchema = mongoose.Schemas.shippingNote;
var objectId = mongoose.Types.ObjectId;
var _ = require('underscore');
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

    this.createGoodsReturn = function (req, res, next) {
        var body = req.body;
        var writeOff;
        var error;
        var WriteOffsModel = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);

        var uId = req.session.uId;
        var date = new Date();
        body.createdBy = {
            user: uId,
            date: date
        };
        body.state = '等待审核中';
        
        writeOff = new WriteOffsModel(body);
        writeOff.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };


    this.goodsReturnUpdate = function (req, res, next) {
        var WriteOffsSchema = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;

        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };
        
        WriteOffsSchema.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);

        });
    };

    this.getList = function (req, res, next) {
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
        var contentType = data.contentType || 'goodsReturn';
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
                    $or: [{type : 'goodsReturn'},{type : 'oemReturn'}]
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


    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'writeOffs', writeOffsSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, writeOff) {
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

    this.getByBuilding = function (req, res, next) {
        var retObj = {};
        var lastDb = req.session.lastDb || 'saas';
        var oemNote = models.get(lastDb, 'oemNote', oemNoteSchema);
        var oemOrder = models.get(lastDb, 'Order', OrderSchema);
        var building = req.query.building || req.params.building;
        var shippingNote = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);

        oemOrder.find({building: building, orderType: 'oemOrders'}, function(err, order){
            if(err){
                return next(err)
            }

            if(order.length == 0){
                retObj.retStatus = 'Fail';
                retObj.retError = '该工程没有来料订单';
                res.status(200).send(retObj);
            }else{
                var orderIds = [];
                for(var i=0; i<order.length; i++){
                    orderIds.push(order[i]._id);
                }
                oemNote.find({order: {$in: orderIds}, reason: 'FO'}, function(err, oemNotes){
                    if(err){
                        return next(err);
                    }

                    if(oemNotes.length == 0){
                        retObj.retStatus = 'Fail';
                        retObj.retError = '该工程没有来料出库计划';
                        res.status(200).send(retObj);
                    }else{
                        var oemIds = [];
                        for(var i=0; i<oemNotes.length; i++){
                            oemIds.push(oemNotes[i]._id);
                        }
                        shippingNote.find({oemNote: {$in: oemIds}, status:'Done'}, function(err, shippingNotes){
                            if(err){
                                return next(err);
                            }

                            if(shippingNotes.length == 0){
                                retObj.retStatus = 'Fail';
                                retObj.retError = '该工程没有来料发货单';
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

};

module.exports = Module;
