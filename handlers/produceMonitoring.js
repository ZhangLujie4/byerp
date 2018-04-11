var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var produceMonitoringSchema = mongoose.Schemas.ProduceMonitoring;
var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
var barCodeSchema = mongoose.Schemas.barCode;
var jobPositionSchema = mongoose.Schemas.JobPosition;
var plantWorkGroupSchema = mongoose.Schemas.plantWorkGroup;
var workCentreSchema = mongoose.Schemas.workCentre;
var scanlogSchema = mongoose.Schemas.scanlog;
var daySheetSchema = mongoose.Schemas.daySheet;
var objectId = mongoose.Types.ObjectId;
var _ = require('underscore');
var lodash = require('lodash');
var async = require('async');
var moment = require('../public/js/libs/moment/moment');

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

    this.createDaySheet = function (req, res, next) {
        var body = req.body;
        var daySheet;
        var daySheetModel = models.get(req.session.lastDb, 'daySheet', daySheetSchema);
        var ScanlogSchema = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var chooseDay = new Date(body.chooseDay);
        var startDate = new Date(moment(chooseDay).utc());
        var endDate = new Date(moment(chooseDay).add(1,'days').utc());
        var uId = req.session.uId;
        var date = new Date();

        ScanlogSchema.aggregate([           

            {
                $match: {
                    status : '0',
                    scantime:{
                        $gt: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $lookup: {
                    from        : 'barCode',
                    localField  : 'barCode',
                    foreignField: '_id',
                    as          : 'barCode'
                }
            },
            {
                $lookup: {
                    from        : 'workCentres',
                    localField  : 'workCentre',
                    foreignField: '_id',
                    as          : 'workCentre'
                }
            },
            {
                $lookup: {
                    from        : 'plantWorkGroup',
                    localField  : 'workGroup',
                    foreignField: '_id',
                    as          : 'workGroup'
                }
            },
            {
                $project: {
                    scantime : 1,
                    uploadtime : 1,
                    note : 1,
                    price : 1,
                    area : 1,
                    status : 1,
                    barCode      : {$arrayElemAt: ['$barCode', 0]},
                    workCentre   : {$arrayElemAt: ['$workCentre', 0]},
                    workGroup    : {$arrayElemAt: ['$workGroup', 0]},
                }
            },
            {
                $lookup: {
                    from        : 'aluveneerOrders',
                    localField  : 'barCode.orderRowId',
                    foreignField: '_id',
                    as          : 'aluveneerOrder'
                }
            },
            {
                $project: {
                    scantime : 1,
                    uploadtime : 1,
                    note : 1,
                    price : 1,
                    area : 1,
                    status : 1,
                    aluveneerOrder : {$arrayElemAt: ['$aluveneerOrder', 0]},
                    workCentre   : 1,
                    workGroup    : 1,
                }
            },
            {
                $project: {
                    scantime : 1,
                    uploadtime : 1,
                    note : 1,
                    price : 1,
                    area : 1,
                    status : 1,
                    building : '$aluveneerOrder.projectName',
                    orderNumber : '$aluveneerOrder.cgdh',
                    workGroup    : 1,
                    workCentre   : 1,
                }
            },
            {
                $group: {
                    _id: {building:'$building', orderNumber:'$orderNumber', workCentre:'$workCentre'},
                    price: {$sum: '$price'},
                    area : {$sum: '$area'},
                    count: {$sum: 1},
                    scantime : {$first: '$scantime'},
                    uploadtime : {$first: '$uploadtime'},
                    note : {$first: '$note'},
                    status : {$first: '$status'},
                    workGroup : {$first: '$workGroup'},
                    workCentre : {$first: '$workCentre'},
                }
            },
            {
                $project: {
                    building  : '$_id.building',
                    orderNumber   : '$_id.orderNumber',
                    day   : '$scantime',
                    uploadtime : 1,
                    note : 1,
                    status : 1,
                    workGroup : 1,
                    workCentre: {
                        processCost: '$price',
                        area: '$area',
                        count: '$count',
                        name: '$workCentre.name',
                        code: '$workCentre.code'
                    }
                }
            },
            {
                $group: {
                    _id: {building: '$building', orderNumber: '$orderNumber'},
                    totalProcess: {$sum: '$workCentre.processCost'},
                    workCentre: {$push: '$workCentre'},
                    building: {$first: '$building'},
                    orderNumber: {$first: '$orderNumber'},
                    day: {$first: '$day'},
                    uploadtime: {$first: '$uploadtime'},
                    note: {$first: '$note'},
                    status: {$first: '$status'},
                    workGroup: {$first: '$workGroup'}
                }
            }
            ],function (err, result) {
                var count;
                var response = {};

                if (err) {
                    return next(err);
                }

                for(var i = 0;i < result.length; i++){
                    var data = result[i];
                    data.createdBy = {
                        user: uId,
                        date: date
                    };
                    delete data._id;

                    daySheet = new daySheetModel(data);
                    daySheet.save(function (err, daySheetResult) {
                        if (err) {
                            return next(err);
                        }
                        res.status(200).send(daySheetResult);
                    });
                }
        });

    };

    this.getByViewType = function (req, res, next) {
        var data=req.query;
        var filter = data.filter||{};
        if(filter.id){
            getForm(req, res, next);
        } 
        else{
            getList(req, res, next);
        }
    };

    function getList(req, res, next) {
        var daySheetSchema = models.get(req.session.lastDb, 'daySheet', daySheetSchema);
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
        var startKey = new Date(moment(new Date()).startOf('month'));
        var endKey = new Date(moment(new Date()).endOf('month'))
        var startDate = (filter.date) ? new Date(filter.date.startDate) : startKey;
        var endDate = (filter.date) ? new Date(moment(filter.date.endDate).add(1,'days')) : endKey;
        var contentType = data.contentType || 'ProduceMonitoring';
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

        daySheetSchema.aggregate([     
            {
                $lookup: {
                    from        : 'building',
                    localField  : 'building',
                    foreignField: '_id',
                    as          : 'projectName'
                }
            }, 
            {
                $project: {
                    projectName  : {$arrayElemAt: ['$projectName', 0]},
                    orderNumber  : 1,
                    day          : 1,
                    totalProcess : 1
                }
            },
            {
                $match: {
                    day: {
                        $lte: endDate,
                        $gte: startDate
                    }
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
                    projectName     : '$root.projectName',
                    orderNumber     : '$root.orderNumber',
                    day             : '$root.day',
                    totalProcess    : '$root.totalProcess',
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

                //count = result[0] && result[0].total ? result[0].total : 0;
                count = result.length;

                response.total = count;
                response.data = result;

                res.status(200).send(response);
        });
    };

    function getForm(req, res, next) {
        var daySheetSchema = models.get(req.session.lastDb, 'daySheet', daySheetSchema);
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
        var id = filter.id;
        var contentType = data.contentType || 'produceMonitoring';
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

        daySheetSchema.aggregate([
            {
                $match: {
                    _id: objectId(id)
                }
            },  
            {
                $lookup: {
                    from        : 'building',
                    localField  : 'building',
                    foreignField: '_id',
                    as          : 'projectName'
                }
            }, 
            {
                $project: {
                    projectName  : {$arrayElemAt: ['$projectName', 0]},
                    orderNumber  : 1,
                    day          : 1,
                    totalProcess : 1,
                    inventory    : 1,
                    workCentre   : 1
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
                    day             : '$root.day',
                    totalProcess    : '$root.totalProcess',
                    inventory       : '$root.inventory',
                    workCentre      : '$root.workCentre',
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

                count = result.length;

                response.total = count;
                response.data = result;

                res.status(200).send(response);
        });
    };

    this.getDetails = function (req, res, next) {
        var BarCodeSchema = models.get(req.session.lastDb, 'barCode', barCodeSchema);
        var GroupSchema = models.get(req.session.lastDb,'plantWorkGroup',plantWorkGroupSchema);
        var WorkCentreSchema = models.get(req.session.lastDb, 'workCentres', workCentreSchema);
        var ScanlogSchema = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var response = {};
        response.data = [];
        var detailId = req.query.id;
        var chooseDay = req.query.chooseDay;
        var startDate = new Date(moment(chooseDay).utc());
        var endDate = new Date(moment(startDate).add(1,'days').utc());
        var error;

        function getTotal(callback){
            ScanlogSchema.aggregate([

                {
                    $match: {
                        scantime:{
                            $gt: startDate,
                            $lt: endDate
                        }
                    }
                },
                {
                    $lookup: {
                        from        : 'barCode',
                        localField  : 'barCode',
                        foreignField: '_id',
                        as          : 'barCode'
                    }
                },
                {
                    $lookup: {
                        from        : 'workCentres',
                        localField  : 'workCentre',
                        foreignField: '_id',
                        as          : 'workCentre'
                    }
                },
                {
                    $lookup: {
                        from        : 'plantWorkGroup',
                        localField  : 'workGroup',
                        foreignField: '_id',
                        as          : 'workGroup'
                    }
                },
                {
                    $project: {
                        id              : 1,
                        barCode         : {$arrayElemAt: ['$barCode', 0]},
                        workCentre      : {$arrayElemAt: ['$workCentre', 0]},
                        workGroup       : {$arrayElemAt: ['$workGroup', 0]},
                        scantime        : 1,
                        uploadtime      : 1,
                        status          : 1,
                        note            : 1,
                        price           : 1,
                        area            : 1
                    }
                },
                {
                    $match: {
                        'workCentre.code' : detailId
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
                        id              : '$root.id',
                        barCode         : '$root.barCode',
                        workCentre      : '$root.workCentre',
                        workGroup       : '$root.workGroup',
                        scantime        : '$root.scantime',
                        uploadtime      : '$root.uploadtime',
                        status          : '$root.status',
                        note            : '$root.note',
                        price           : '$root.price',
                        area            : '$root.area',
                        total           : 1
                    }
                }
                ],function (err, result) {

                    var count;
                    var response = {};

                    if (err) {
                        return next(err);
                    }

                    count = result[0] && result[0].total ? result[0].total : 0;

                    response.data = result;

                    callback(null, response);
            });

        };

        async.waterfall([getTotal], function(err, totalResult){

            if(err){
                return next(err);
            }

            var response = {};

            if (err) {
                return next(err);
            }

            response = totalResult;        
            res.status(200).send(response);
        });       
        
    };

    this.getDays = function (req, res, next) {
        var BarCodeSchema = models.get(req.session.lastDb, 'barCode', barCodeSchema);
        var GroupSchema = models.get(req.session.lastDb,'plantWorkGroup',plantWorkGroupSchema);
        var WorkCentreSchema = models.get(req.session.lastDb, 'workCentres', workCentreSchema);
        var ScanlogSchema = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var response = {};
        response.data = [];
        var detailId = req.query.id;
        var startDate = new Date(moment().startOf('days').utc());
        var endDate = new Date(moment(startDate).add(1,'days').utc());

        ScanlogSchema.aggregate([           

            {
                $match: {
                    status : '0'
                }
            },
            {
                $project: {
                    scantime : 1,
                }
            },
            {
                $project: {
                    year : {$year: '$scantime'},
                    month: {$month: '$scantime'},
                    day  : {$dayOfMonth: '$scantime'},
                }
            },
            {
                $group: {
                    _id: {day:'$day', month:'$month', year:'$year'},
                    price: {$sum: '$price'}
                }
            },
            {
                $project: {
                    year            : '$_id.year',
                    month           : '$_id.month',
                    day             : '$_id.day'
                }
            }
            ],function (err, result) {
                var count;
                var response = {};

                if (err) {
                    return next(err);
                }
                
                for(var i=0;i<result.length;i++){
                    result[i].days = result[i].year.toString()+'-'+result[i].month.toString()+'-'+result[i].day.toString();
                    result[i].datekey = result[i].year.toString()+'-'+result[i].month.toString()+'-'+result[i].day.toString();
                }

                response.data = result;
                res.status(200).send(response);
        });
    };

    this.bulkRemove = function (req, res, next) {
        var daySheetSchema = models.get(req.session.lastDb, 'daySheet', daySheetSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            daySheetSchema.findByIdAndRemove(id, function (err, daySheet) {
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
