var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var colorNumberSchema = mongoose.Schemas.ColorNumber;
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

    this.createColorNumber = function (req, res, next) {
        var body = req.body;
        var colorNumber;
        var error;
        var ColorNumberModel = models.get(req.session.lastDb, 'colorNumber', colorNumberSchema);

        var uId = req.session.uId;
        var date = new Date();
        body.status = 'new';
        body.createdBy = {
            user: uId,
            date: date
        };

        var colorCodeModel = ['A','B','C','D','E','F','G','H'];
        ColorNumberModel.find({projectId : body.projectId}, function (err, colorNumber) {
            
            if(colorNumber.length < 8){
                body.colorCode = colorCodeModel[colorNumber.length];
            }
            else{
                var tempCode = colorNumber.length - 7;
                body.colorCode = 'H' + tempCode.toString();
            }
            
            colorNumber = new ColorNumberModel(body);
            colorNumber.save(function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
        });

    };

    this.colorNumberUpdate = function (req, res, next) {
        var ColorNumberSchema = models.get(req.session.lastDb, 'colorNumber', colorNumberSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };
        
        ColorNumberSchema.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }

            var historyOptions = {
                contentType: 'COLORNUMBER',
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
        var ColorNumberSchema = models.get(req.session.lastDb, 'colorNumber', colorNumberSchema);
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
        var contentType = data.contentType || 'colorNumber';
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
            sort = {'projectId': 1};
        }    

        ColorNumberSchema.aggregate([           

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
                    from        : 'building',
                    localField  : 'projectId',
                    foreignField: '_id',
                    as          : 'projectId'
                }
            },
            {
                $project: {
                    projectId       : {$arrayElemAt: ['$projectId', 0]},
                    colorNumber     : 1,
                    colorCode       : 1,
                    status          : 1,
                    'createdBy.user': {$arrayElemAt: ['$createdBy.user', 0]},
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
                    projectId       : '$root.projectId.name',
                    colorNumber     : '$root.colorNumber',
                    colorCode       : '$root.colorCode',
                    status          : '$root.status',
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
        var Model = models.get(req.session.lastDb, 'colorNumber', colorNumberSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, colorNumber) {
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

        models.get(req.session.lastDb, 'colorNumber', colorNumberSchema).findByIdAndRemove(_id, function (err, colorNumber) {
            if (err) {
                return next(err);
            }

            res.send(200, {success: 'Success removed'});
        });
    };
 
    this.getForDd = function (req, res, next) {
        var response = {};
        response.data = [];
        var building = req.query.building || req.params.building ;

        models.get(req.session.lastDb, 'colorNumber', colorNumberSchema).find({projectId: building}, function (err, result) {
            
            if (err) {
                return next(err);
            }

            response.data = result;
            res.send(response);
        });
    };

};

module.exports = Module;
