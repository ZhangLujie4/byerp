var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var chargeItemsSchema = mongoose.Schemas.ChargeItem;
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

    this.createChargeItem = function (req, res, next) {
        var body = req.body;
        var chargeItems;
        var error;
        var ChargeItemsModel = models.get(req.session.lastDb, 'chargeItems', chargeItemsSchema);

        var uId = req.session.uId;
        var date = new Date();
        body.status = 'new';
        body.createdBy = {
            user: uId,
            date: date
        };
        
        chargeItems = new ChargeItemsModel(body);
        chargeItems.save(function (err, result) {
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

    this.chargeItemUpdate = function (req, res, next) {
        var ChargeItemsSchema = models.get(req.session.lastDb, 'chargeItems', chargeItemsSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };
        
        ChargeItemsSchema.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }

            var historyOptions = {
                contentType: 'CHARGEITEMS',
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
        var ChargeItemsSchema = models.get(req.session.lastDb, 'chargeItems', chargeItemsSchema);
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
            sort = {'chargeItem': -1};
        }    

        ChargeItemsSchema.aggregate([           

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
                    chargeItem      : 1,
                    unit            : 1,
                    price           : 1,
                    'createdBy.user': {$arrayElemAt: ['$createdBy.user', 0]},
                    status          : 1,
                    code            : 1
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
                    chargeItem      : '$root.chargeItem',
                    unit            : '$root.unit',
                    price           : '$root.price',
                    code            : '$root.code',
                    'createdBy.user': '$root.createdBy.user.login',
                    status          : '$root.status',
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
        var Model = models.get(req.session.lastDb, 'ChargeItems', chargeItemsSchema);
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

        models.get(req.session.lastDb, 'ChargeItems', chargeItemsSchema).findByIdAndRemove(_id, function (err, chargeItem) {
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
        models.get(req.session.lastDb, 'chargeItems', chargeItemsSchema).find({status: 'new'}, function (err, _chargeItem) {
            if (err) {
                return next(err);
            }

            response.data = _chargeItem;
            res.send(response);
        }).sort({'chargeItem' : 1});
    };
 

};

module.exports = Module;
