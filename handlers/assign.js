var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var designRecSchema = mongoose.Schemas.DesignRec;
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

    this.createAssign = function (req, res, next) {
        var body = req.body;
        var gendanOrders;
        var error;
        var DesignRecModel = models.get(req.session.lastDb, 'designRec', designRecSchema);

        body.uId = req.session.uId;
        
        //body.editedBy.user = body.uId;
        //body.editedBy.date = new Date();
        var designRec = new DesignRecModel(body);
        designRec.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });


    };


    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'designRec', designRecSchema);
        var headers = req.headers;
        //var addNote = headers.addnote;
        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'designRec';
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

            Model.findByIdAndUpdate(id, {$push: {attachments: {$each: file}}}, {new: true}, function (err, response) {
                if (err) {
                    return next(err);
                }

                response.fileStatus = '文件已上传';
                response.uploadDate = new Date();

                Model.findByIdAndUpdate(id, response, function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    
                });

                res.status(200).send({success: 'designRec updated success', data: response});
            });

        });

    };

    this.AssignUpdate = function (req, res, next) {
        var DesignRecSchema = models.get(req.session.lastDb, 'designRec', designRecSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        
        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };        
        data.orderStatus = '订单已分配';

        DesignRecSchema.findByIdAndUpdate(_id, data, function (err, result) {
            if (err) {
                return next(err);
            }

            var historyOptions = {
                contentType: 'DESIGNREC',
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
        var DesignRecSchema = models.get(req.session.lastDb, 'designRec', designRecSchema);
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
        var contentType = data.contentType || 'assign';
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
            sort = {'projectName': -1};
        }   

        DesignRecSchema.aggregate([     

            {
                $lookup: {
                    from        : 'building',
                    localField  : 'projectName',
                    foreignField: '_id',
                    as          : 'projectName'
                }
            },
            {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'designer',
                    foreignField: '_id',
                    as          : 'designer'
                }
            },
            {
                $project: {
                    projectName     : {$arrayElemAt: ['$projectName', 0]},
                    orderNumber     : 1,
                    acreage         : 1,
                    arrivalDate     : 1,
                    colorNumber     : 1,
                    protectType     : 1,
                    isMonitoring    : 1,
                    follower        : 1,
                    uploadDate      : 1,
                    attachments     : 1,
                    designer        : {$arrayElemAt: ['$designer', 0]},
                    fileStatus      : 1,
                    designDays      : 1,
                    comment         : 1,
                    orderStatus     : 1
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
                    projectName     : '$root.projectName.name',
                    orderNumber     : '$root.orderNumber',
                    acreage         : '$root.acreage',
                    arrivalDate     : '$root.arrivalDate',
                    colorNumber     : '$root.colorNumber',
                    protectType     : '$root.protectType',
                    isMonitoring    : '$root.isMonitoring',
                    follower        : '$root.follower',
                    uploadDate      : '$root.uploadDate',
                    attachments     : '$root.attachments',
                    designer        : '$root.designer.name',
                    fileStatus      : '$root.fileStatus',
                    designDays      : '$root.designDays',
                    comment         : '$root.comment',
                    orderStatus     : '$root.orderStatus',
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
        var Model = models.get(req.session.lastDb, 'designRec', designRecSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, designRec) {
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


    this.remove = function (req, res, next) {
        var _id = req.params._id;

        models.get(req.session.lastDb, 'designRec', designRecSchema).findByIdAndRemove(_id, function (err, designRec) {
            if (err) {
                return next(err);
            }

            res.send(200, {success: 'Success removed'});
        });
    };

    this.getFilterValues = function (req, res, next) {
        var task = models.get(req.session.lastDb, 'Task', tasksSchema);

        task.aggregate([
            {
                $group: {
                    _id : null,
                    type: {
                        $addToSet: '$type'
                    }
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    
 

};

module.exports = Module;
