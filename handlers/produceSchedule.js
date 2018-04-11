var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var produceScheduleSchema = mongoose.Schemas.ProduceSchedule;
var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
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

    this.createProduceSchedule = function (req, res, next) {
        var body = req.body;
        var error;
        var ProduceScheduleModel = models.get(req.session.lastDb, 'produceSchedule', produceScheduleSchema);

        var uId = req.session.uId;
        var date = new Date();

        body.status = 'new';
        body.createdBy = {
            user: uId,
            date: date
        }; 

        //if((date.getHours() * 100 + date.getMinutes()) <= 1730 && (date.getHours() * 100 + date.getMinutes()) >= 800){

            var tempDate = body.insertDate.split('-');
            body.scheduleDate = (parseInt(tempDate[0])*10000 + parseInt(tempDate[1])*100 + parseInt(tempDate[2])).toString();

            ProduceScheduleModel.find({scheduleDate : body.scheduleDate}, function (err, produceSchedule) {
               
                body.sequence = tempDate[0]*1000000 + tempDate[1]*10000 + tempDate[2]*100 + produceSchedule.length + 1;
                
                var produceSchedule = new ProduceScheduleModel(body);
                produceSchedule.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send(result);
                });
            });
        /*}
        else if((date.getHours() * 100 + date.getMinutes()) > 1730 && (date.getHours() * 100 + date.getMinutes()) <= 2359){
            res.status(404).send({error: '现在已经是下班时间!'});
        }*/

    };


    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'produceSchedule', produceScheduleSchema);
        var headers = req.headers;
        //var addNote = headers.addnote;
        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'produceSchedule';
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
            if (err) {
                return next(err);
            }

            Model.findByIdAndUpdate(id, {$push: {attachments: {$each: file}}}, {new: true}, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({success: 'produceSchedule updated success', data: response});
            });
        });

    };

    this.produceScheduleUpdate = function (req, res, next) {
        var ProduceScheduleSchema = models.get(req.session.lastDb, 'produceSchedule', produceScheduleSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;

        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };
        
        ProduceScheduleSchema.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }
            
            var historyOptions = {
                contentType: 'PRODUCESCHEDULE',
                data: data,
                dbName: dbName,
                contentId: _id
            };

            HistoryService.addEntry(historyOptions, function(err, result2){
                if(err){
                    return next(err);
                }
                res.status(200).send(result2);
            })
        });
    };

    this.getList = function (req, res, next) {
        var ProduceScheduleSchema = models.get(req.session.lastDb, 'produceSchedule', produceScheduleSchema);
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
        var contentType = data.contentType || 'produceSchedule';
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

        ProduceScheduleSchema.aggregate([     

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
                    from        : 'Users',
                    localField  : 'createdBy.user',
                    foreignField: '_id',
                    as          : 'createdBy.user'
                }
            },
            {
                $project: {
                    projectId       : {$arrayElemAt: ['$projectId', 0]},
                    sequence        : 1,
                    produceType     : 1,
                    orderNumber     : 1,
                    isApproval      : 1,
                    'createdBy.user': {$arrayElemAt: ['$createdBy.user', 0]},
                }
            }, {
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
                    projectId       : '$root.projectId.name',
                    sequence        : '$root.sequence',
                    produceType     : '$root.produceType',
                    orderNumber     : '$root.orderNumber',
                    isApproval      : '$root.isApproval',
                    'createdBy.user': '$root.createdBy.user.login',
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
        var Model = models.get(req.session.lastDb, 'produceSchedule', produceScheduleSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, produceSchedule) {
                if (err) {
                    return cb(err);
                }
                var scheduleDate = produceSchedule.scheduleDate;
                var sequence = produceSchedule.sequence;

                Model.find({scheduleDate : scheduleDate , sequence : {$gt: sequence}}, function (err, produce){
                    if(err){
                        return cb(err);
                    }
                    for(var i = 0; i < produce.length; i++){
                        var tempSequence = produce[i].sequence-1;
                        var id = produce[i]._id;
                        Model.findByIdAndUpdate(id, {sequence: tempSequence}, function(err, result){
                            if(err){
                                return cb(err);
                            }
                        });
                    }
                    cb();
                });

            });
            
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: true});
        });
    };


    this.remove = function (req, res, next) {
        var _id = req.params._id;

        models.get(req.session.lastDb, 'produceSchedule', produceScheduleSchema).findByIdAndRemove(_id, function (err, produceSchedule) {
            if (err) {
                return next(err);
            }

            res.send(200, {success: 'Success removed'});
        });
    };

    this.getOrderNumber = function (req, res, next) {

        var AluveneerOrdersSchema = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var data = req.query;
        var id = data ? data._id : null;

        AluveneerOrdersSchema.aggregate([     
            {
                $match: {
                    projectName : objectId(id),
                }
            }, 
             {
                $lookup: {
                    from        : 'building',
                    localField  : 'projectName',
                    foreignField: '_id',
                    as          : 'projectName'
                }
            }, 
            {
                $project: {
                    projectName  : {$arrayElemAt: ['$projectName', 0]},
                    cgdh         : 1,
                }
            },
            {
                $group: {
                    _id  : "$cgdh",
                    total: {$sum: 1},
                    root : {$push: '$$ROOT'}
                }
            }
            ],function (err, result) {
                var response = {};

                if (err) {
                    return next(err);
                }

                response.data = result;
                res.status(200).send(response);
        });
    };

};

module.exports = Module;
