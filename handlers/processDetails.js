var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var workOrdersSchema = mongoose.Schemas.WorkOrder;
var processDetailsSchema = mongoose.Schemas.ProcessDetail;
var orderReckonsSchema = mongoose.Schemas.OrderReckon;
var moment = require('../public/js/libs/moment/moment');
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

    this.createProcessDetail = function (req, res, next) {
        var body = req.body;
        var processDetails;
        var error;
        var ProcessDetailsModel = models.get(req.session.lastDb, 'processDetails', processDetailsSchema);

        body.uId = req.session.uId;

        processDetails = new ProcessDetailsModel(body);
        processDetails.save(function (err, result) {
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

    this.processDetailUpdate = function (req, res, next) {
        var ProcessDetailsSchema = models.get(req.session.lastDb, 'processDetails', processDetailsSchema);
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        
        //data.editedBy.user = req.session.uId;
        ProcessDetailsSchema.findByIdAndUpdate(_id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    /*this.getList = function (req, res, next) {
        var ProcessDetailsSchema = models.get(req.session.lastDb, 'processDetails', processDetailsSchema);
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
        var filterMapper = new FilterMapper();
        var currentDay = moment().year()*100 + moment().month() + 1;
        var projectDepCost = 0;
        var processCost = 0;

        if (filter) {
            filterObj = filterMapper.mapFilter(filter); // caseFilterOpp(filter);
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
                    processContents     : 1,
                    fillDate            : 1,
                    factoryCost         : 1,
                    groupCost           : 1,
                    operator            : 1,
                    isApproval          : 1,
                    currentDate         : {
                        $add: [{$multiply: [{$year: '$fillDate'}, 100]}, {$month: '$fillDate'}]                        
                    }
                }
            }, {
                $match: {
                    $and: optionsObject
                }
            }, {
                $match: {
                    currentDate : currentDay,
                    isApproval  : true
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
                    processContents     : '$root.processContents',
                    factoryCost         : '$root.factoryCost',
                    groupCost           : '$root.groupCost',                
                    operator            : '$root.operator',
                    isApproval          : '$root.isApproval',
                    fillDate            : '$root.fillDate',
                    currentDate         : '$root.currentDate',
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

                for(var i=0; i < count; i++){
                    response.data[i].projectDepCost = response.data[i].factoryCost;
                    response.data[i].processCost = response.data[i].groupCost;
                }
                
                res.status(200).send(response);
        });

    };*/

    this.getList = function (req, res, next) {
        var ProcessDetailsSchema = models.get(req.session.lastDb, 'processDetails', processDetailsSchema);
        var WorkOrdersSchema = models.get(req.session.lastDb, 'workOrders', workOrdersSchema);
        var OrderReckonsSchema = models.get(req.session.lastDb, 'orderReckons', orderReckonsSchema);
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
        var filterMapper = new FilterMapper();
        var currentDay = moment().year()*100 + moment().month() + 1;
        var projectDepCost = 0;
        var processCost = 0;
        var processDetailArray = [];
        var total = {};

        if (filter) {
            filterObj = filterMapper.mapFilter(filter); // caseFilterOpp(filter);
        }

        optionsObject.push(filterObj);
        
        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'projectName': -1};
        }    

        function getOrderReckon(callback){
            OrderReckonsSchema.aggregate([           
                {
                    $lookup: {
                        from        : 'Opportunities',
                        localField  : 'projectName',
                        foreignField: '_id',
                        as          : 'projectName'
                    }
                },
                {
                    $lookup: {
                        from        : 'Employees',
                        localField  : 'employeeName',
                        foreignField: '_id',
                        as          : 'employeeName'
                    }
                },
                {
                    $project: {
                        projectName         : {$arrayElemAt: ['$projectName', 0]},
                        workNumber          : 1,
                        processContent      : 1,
                        price               : 1,
                        reckonDate          : 1,
                        employeeName        : {$arrayElemAt: ['$employeeName', 0]},
                        employeeQuantity    : 1,
                        currentDate         : {
                            $add: [{$multiply: [{$year: '$reckonDate'}, 100]}, {$month: '$reckonDate'}]                        
                        }
                    }
                }, {
                    $match: {
                        currentDate : currentDay
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
                        workNumber      : '$root.workNumber',
                        processContent  : '$root.processContent',
                        price           : '$root.price',
                        reckonDate      : '$root.reckonDate',
                        employeeName    : '$root.employeeName.name',
                        employeeQuantity: '$root.employeeQuantity',
                        currentDate     : '$root.currentDate',
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
                ],function (err, OrderReckon) {

                    if (err) {
                        return next(err);
                    }

                    callback(null,OrderReckon);
                });
        }
        

        function getTotal(OrderReckonResult, callback){
            //var totalCost;
            var orderCost = {};

            async.each(OrderReckonResult,function(orderReckonObj, asyncCb){                
                
                WorkOrdersSchema.aggregate([
                    {
                        $match: {
                            workNumber  : orderReckonObj.workNumber
                        }
                    },           
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
                            processContents     : 1,
                            fillDate            : 1,
                            factoryCost         : 1,
                            groupCost           : 1,
                            operator            : 1,
                            isApproval          : 1
                        }
                    }, {
                        $match: {
                            $and: optionsObject
                        }
                    }, {
                        $match: {
                            isApproval  : true
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
                            processContents     : '$root.processContents',
                            factoryCost         : '$root.factoryCost',
                            groupCost           : '$root.groupCost',                
                            operator            : '$root.operator',
                            isApproval          : '$root.isApproval',
                            fillDate            : '$root.fillDate',
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
                    ],function (err, workOrderresult) {
                        var count;
                        var response = {};
                        var completePercent;

                        if (err) {
                            return next(err);
                        }

                        count = workOrderresult[0] && workOrderresult[0].total ? workOrderresult[0].total : 0;

                        response.total = count;
                        response.data = workOrderresult;

                        //totalCost = orderReckonObj.price * orderReckonObj.employeeQuantity;

                        if(!orderCost[orderReckonObj.workNumber]){
                            orderCost[orderReckonObj.workNumber] = {
                                totalCost  :  0,
                                groupCost  :  response.data[0].groupCost
                            }
                        }

                        orderCost[orderReckonObj.workNumber].totalCost += orderReckonObj.price * orderReckonObj.employeeQuantity;

                        //completePercent = totalCost * 100 / response.data[0].groupCost ;
                        completePercent = orderCost[orderReckonObj.workNumber].totalCost * 100 / response.data[0].groupCost ;

                        total[response.data[0].workNumber] = {};
                        /*if(response.data[0]){
                            response.data[0].projectDepCost = response.data[0].factoryCost;
                            response.data[0].processCost = response.data[0].groupCost;
                        }*/

                        if(response.data[0]){

                            total[response.data[0].workNumber] = {
                                _id              : response.data[0] ? response.data[0]._id : '',
                                projectName      : response.data[0] ? response.data[0].projectName : '',
                                workNumber       : response.data[0] ? response.data[0].workNumber : '',
                                chargeItems      : response.data[0] ? response.data[0].chargeItems : [],
                                processContents  : response.data[0] ? response.data[0].processContents : [],
                                projectDepCost   : response.data[0] ? response.data[0].factoryCost : 0,
                                processCost      : response.data[0] ? response.data[0].groupCost : 0,
                                fillDate         : response.data[0] ? response.data[0].fillDate : '',
                                operator         : response.data[0] ? response.data[0].operator : '',
                                completePercent  : completePercent
                            }
                            //processDetailArray.push(total[response.data.workNumber]);
                        }

                        /*for(var i=0; i < count; i++){
                            response.data[i].projectDepCost = response.data[i].factoryCost;
                            response.data[i].processCost = response.data[i].groupCost;
                        }*/
                        asyncCb(null, workOrderresult);
                        //res.status(200).send(response);
                });
            });

            setTimeout(function(){
                for(var key in total){
                    processDetailArray.push(total[key])
                }
                callback(null, processDetailArray);
            }, 100);
            
        }

        async.waterfall([getOrderReckon, getTotal], function(err, result){
            if(err){
                return next(err);
            }

            var response = {};

            if (err) {
                return next(err);
            }

            response.total = result.length;
            response.data = result;
           

            res.status(200).send(response);
        });

    };

    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'processDetails',  processDetailsSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, processDetail) {
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

        models.get(req.session.lastDb, 'processDetails',  processDetailsSchema).findByIdAndRemove(_id, function (err, processDetail) {
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

    this.getChargeItems = function (req, res, next) {
        var response = {};
        response.data = [];
        models.get(req.session.lastDb, 'chargeItems', chargeItemsSchema).find({}, function (err, _chargeItem) {
            if (err) {
                return next(err);
            }

            response.data = _chargeItem;
            res.send(response);
        });
    };
 

};

module.exports = Module;
