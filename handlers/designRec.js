var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var designRecSchema = mongoose.Schemas.DesignRec;
var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
var buildingContractSchema = mongoose.Schemas.BuildingContract;
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

    this.createDesignRec = function (req, res, next) {
        var body = req.body;
        var gendanOrders;
        var error;
        var DesignRecModel = models.get(req.session.lastDb, 'designRec', designRecSchema);

        var uId = req.session.uId;
        var date = new Date();
        body.status = 'new';
        body.createdBy = {
            user: uId,
            date: date
        };

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

    this.designRecUpdate = function (req, res, next) {
        var DesignRecSchema = models.get(req.session.lastDb, 'designRec', designRecSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;

        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };
        
        DesignRecSchema.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }

            data.createdBy = {
                user: result.createdBy.user,
                date: result.createdBy.date
            };
            data.projectName = result.projectName;
            data.designer = result.designer;
            data.attachments = result.attachments;
            data.fileStatus = result.fileStatus;
            data.uploadDate = result.uploadDate;
            
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
        var contentType = data.contentType || 'designRec';
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
                $lookup: {
                    from        : 'Users',
                    localField  : 'createdBy.user',
                    foreignField: '_id',
                    as          : 'createdBy.user'
                }
            },
            {
                $lookup: {
                    from        : 'colorNumber',
                    localField  : 'colorNumber',
                    foreignField: '_id',
                    as          : 'colorNumber'
                }
            },
            {
                $project: {
                    projectName     : {$arrayElemAt: ['$projectName', 0]},
                    orderNumber     : 1,
                    acreage         : 1,
                    arrivalDate     : 1,
                    colorNumber     : {$arrayElemAt: ['$colorNumber', 0]},
                    protectType     : 1,
                    isMonitoring    : 1,
                    isReview        : 1,
                    isConfirm       : 1,
                    follower        : 1,
                    uploadDate      : 1,
                    attachments     : 1,
                    designer        : {$arrayElemAt: ['$designer', 0]},
                    fileStatus      : 1,
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
                    projectName     : '$root.projectName',
                    orderNumber     : '$root.orderNumber',
                    acreage         : '$root.acreage',
                    arrivalDate     : '$root.arrivalDate',
                    colorNumber     : '$root.colorNumber',
                    protectType     : '$root.protectType',
                    isMonitoring    : '$root.isMonitoring',
                    isReview        : '$root.isReview',
                    isConfirm       : '$root.isConfirm',
                    follower        : '$root.follower',
                    uploadDate      : '$root.uploadDate',
                    attachments     : '$root.attachments',
                    designer        : '$root.designer.name',
                    fileStatus      : '$root.fileStatus',
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
        var Model = models.get(req.session.lastDb, 'designRec', designRecSchema);
        var AluveneerOrdersModel = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var count = 0;

        async.each(ids, function (id, cb) {
            Model.findById(id , function (err, result) {
                if (err) {
                    return next(err);
                }

                AluveneerOrdersModel.find({projectName : result.projectName, cgdh : result.orderNumber}, function (err, alu) {
                    if (err) {
                        return next(err);
                    }

                    if(alu.length > 0){
                        count = count + 1;
                        cb();
                    }
                    else{
                        Model.findByIdAndRemove(id, function (err, designRec) {
                            if (err) {
                                return err(err);
                            }

                            cb();
                        });
                    }

                });
                
            });            
            
        }, function (err) {
            if (err) {
                return next(err);
            }

            if(count>0){
                res.status(400).send({error: '有设计订单已使用此客户订单编号，无法删除'});
            }
            else{
                res.status(200).send({success: true});
            }
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

    this.getBuildingContract = function (req, res, next) {
        var response = {};
        response.data = [];
        models.get(req.session.lastDb, 'buildingContract', buildingContractSchema).find({}, function (err, _buildingContract) {
            if (err) {
                return next(err);
            }

            response.data = _buildingContract;
            res.send(response);
        });
    };

};

module.exports = Module;
