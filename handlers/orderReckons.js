var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var orderReckonsSchema = mongoose.Schemas.OrderReckon;
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

    this.createOrderReckon = function (req, res, next) {
        var body = req.body;
        var orderReckons;
        var error;
        var OrderReckonsModel = models.get(req.session.lastDb, 'orderReckons', orderReckonsSchema);

        body.uId = req.session.uId;
        
        //body.editedBy.user = body.uId;
        //body.editedBy.date = new Date();
        orderReckons = new OrderReckonsModel(body);
        orderReckons.save(function (err, result) {
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

    this.orderReckonUpdate = function (req, res, next) {
        var OrderReckonsSchema = models.get(req.session.lastDb, 'orderReckons', orderReckonsSchema);
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        
        //data.editedBy.user = req.session.uId;
        OrderReckonsSchema.findByIdAndUpdate(_id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.getList = function (req, res, next) {
        var OrderReckonsSchema = models.get(req.session.lastDb, 'orderReckons', orderReckonsSchema);
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var keys;
        var parallelTasks;
        
        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'workNumber': -1};
        }    

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
                    employeeQuantity    : 1
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
        var Model = models.get(req.session.lastDb, 'orderReckons', orderReckonsSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, orderReckon) {
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

        models.get(req.session.lastDb, 'orderReckons', orderReckonsSchema).findByIdAndRemove(_id, function (err, orderReckon) {
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
