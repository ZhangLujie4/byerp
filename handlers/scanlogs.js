var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var scanlogSchema = mongoose.Schemas.scanlog;
var barCodeSchema = mongoose.Schemas.barCode;
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

    this.createScanlog = function (req, res, next) {
        var body = req.body;
        var writeOff;
        var error;
        var scanlogModel = models.get(req.session.lastDb, 'scanlog', scanlogSchema);
        
        var scanlog = new scanlogModel(body);
        scanlog.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.createBarcode = function (req, res, next) {
        var body = req.body;
        var writeOff;
        var error;
        var barCodeModel = models.get(req.session.lastDb, 'barCode', barCodeSchema);
        
        var barCode = new barCodeModel(body);
        barCode.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.scanlogUpdate = function (req, res, next) {
        var scanlogSchema = models.get(req.session.lastDb, 'scanlog', scanlogSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        
        scanlogSchema.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);

        });
    };

    this.getList = function (req, res, next) {
        var scanlogSchema = models.get(req.session.lastDb, 'scanlog', scanlogSchema);
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
        var contentType = data.contentType || 'scanlogs';
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

        scanlogSchema.aggregate([     

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
                    barCode         : {$arrayElemAt: ['$barCode', 0]},
                    workCentre      : {$arrayElemAt: ['$workCentre', 0]},
                    workGroup       : {$arrayElemAt: ['$workGroup', 0]},
                    scantime        : 1,
                    uploadtime      : 1,
                    status          : 1,
                    note            : 1
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
                    barCode         : '$root.barCode',
                    workCentre      : '$root.workCentre',
                    workGroup       : '$root.workGroup',
                    scantime        : '$root.scantime',
                    uploadtime      : '$root.uploadtime',
                    status          : '$root.status',
                    note            : '$root.note',
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
        var Model = models.get(req.session.lastDb, 'scanlog', scanlogSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, scanlog) {
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
