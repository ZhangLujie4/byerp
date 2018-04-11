var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var workOrdersSchema = mongoose.Schemas.WorkOrder;
var opportunitiesSchema = mongoose.Schemas.Opportunitie;
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

    this.createWorkOrder = function (req, res, next) {
        var body = req.body;
        var workOrders;
        var chargeSum = 0;
        var processSum = 0;
        var chargeMul;
        var processMul;
        var error;
        var WorkOrdersModel = models.get(req.session.lastDb, 'workOrders', workOrdersSchema);

        //body.uId = req.session.uId;
        
        var chargeLength = body.chargeItems.length;
        for(var i = 0; i < chargeLength ; i++){            
            chargeMul = body.chargeItems[i].price * body.chargeItems[i].quantity;
            chargeSum = chargeSum + chargeMul;
                        
        }

        var processLength = body.processContents.length;
        for(var j = 0; j < processLength ; j++){            
            processMul = body.processContents[j].price * body.processContents[j].quantity;
            processSum = processSum + processMul;
                        
        }

        body.factoryCost = chargeSum;
        body.groupCost = processSum;
        body.factoryProfit = body.factoryCost - body.groupCost;

        workOrders = new WorkOrdersModel(body);
        workOrders.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });


    };


    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'Tasks', tasksSchema);
        var headers = req.headers;
        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'tasks';
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

                res.status(200).send({success: 'Tasks updated success', data: response});
            });
        });
    };

    this.workOrderUpdate = function (req, res, next) {
        var WorkOrdersSchema = models.get(req.session.lastDb, 'workOrders', workOrdersSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var chargeSum = 0;
        var processSum = 0;
        var chargeMul;
        var processMul;
        var data = req.body;
        delete data._id;

        var chargeLength = data.chargeItems.length;
        for(var i = 0; i < chargeLength ; i++){            
            chargeMul = data.chargeItems[i].price * data.chargeItems[i].quantity;
            chargeSum = chargeSum + chargeMul;
                        
        }

        var processLength = data.processContents.length;
        for(var j = 0; j < processLength ; j++){            
            processMul = data.processContents[j].price * data.processContents[j].quantity;
            processSum = processSum + processMul;
                        
        }

        data.factoryCost = chargeSum;
        data.groupCost = processSum;
        data.factoryProfit = data.factoryCost - data.groupCost;
        
        //data.editedBy.user = req.session.uId;
        WorkOrdersSchema.findByIdAndUpdate(_id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            
            var historyOptions = {
                contentType: 'WORKORDERS',
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
        var WorkOrdersSchema = models.get(req.session.lastDb, 'workOrders', workOrdersSchema);
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
        var contentType = data.contentType || 'workOrders';
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

        WorkOrdersSchema.aggregate([           
            {
                $lookup: {
                    from        : 'Opportunities',
                    localField  : 'projectName',
                    foreignField: '_id',
                    as          : 'projectName'
                }
            },
            {
                $project: {
                    projectName         : {$arrayElemAt: ['$projectName', 0]},
                    workNumber          : 1,
                    chargeItems         : 1,
                    processGroup        : 1,
                    processContents     : 1,
                    operatorNumber      : 1,
                    fillDate            : 1,
                    operator            : 1
                }
            }, {
                $match: {
                    $and: optionsObject
                }
            }, {
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
                    _id                 : '$root._id',
                    projectName         : '$root.projectName.name',
                    workNumber          : '$root.workNumber',
                    chargeItems         : '$root.chargeItems',
                    processGroup        : '$root.processGroup',
                    processContents     : '$root.processContents',
                    operatorNumber      : '$root.operatorNumber',
                    fillDate            : '$root.fillDate',
                    operator            : '$root.operator',
                    total               : 1
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
        var Model = models.get(req.session.lastDb, 'workOrders', workOrdersSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, chargeItem) {
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

        models.get(req.session.lastDb, 'workOrders', workOrdersSchema).findByIdAndRemove(_id, function (err, processContent) {
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

    this.getOpportunitie = function (req, res, next) {
        var response = {};
        response.data = [];
        models.get(req.session.lastDb, 'Opportunitie', opportunitiesSchema).find({}, function (err, _opportunitie) {
            if (err) {
                return next(err);
            }

            response.data = _opportunitie;
            res.send(response);
        });
    };

    this.getWorkOrder = function (req, res, next) {
        var WorkOrder = models.get(req.session.lastDb, 'workOrders', workOrdersSchema);
        var data = req.query;
        var id = data ? data._id : null;

        WorkOrder
            .find({projectName : id})
            .lean()
            .exec(function (err, workOrders) {
                if (err) {
                    return next(err);
                }
                res.status(200).send({data: workOrders});
            });
    };

    this.getProcess = function (req, res, next) {
        var WorkOrder = models.get(req.session.lastDb, 'workOrders', workOrdersSchema);
        var data = req.query;
        var id = data ? data._id : null;

        WorkOrder
            .find({workNumber : id})
            .lean()
            .exec(function (err, workOrders) {
                if (err) {
                    return next(err);
                }
                res.status(200).send({data: workOrders});
            });
    };

    this.getApprovalOrder = function (req, res, next) {
        var WorkOrder = models.get(req.session.lastDb, 'workOrders', workOrdersSchema);

        WorkOrder
            .find({isApproval : true})
            .populate('projectName', '_id name')
            .lean()
            .exec(function (err, workOrders) {
                if (err) {
                    return next(err);
                }
                res.status(200).send({data: workOrders});
            });
    };

 

};

module.exports = Module;
