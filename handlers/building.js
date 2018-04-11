var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var buildingSchema = mongoose.Schemas.Building;
var buildingContractSchema = mongoose.Schemas.BuildingContract;
var CustomerSchema = mongoose.Schemas.Customer;
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

    this.createBuilding = function (req, res, next) {
        var body = req.body;
        var error;
        var BuildingModel = models.get(req.session.lastDb, 'building', buildingSchema);

        var uId = req.session.uId;
        var date = new Date();
        body.status = 'new';
        body.createdBy = {
            user: uId,
            date: date
        };

        var building = new BuildingModel(body);
        building.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });


    };

    this.buildingUpdate = function (req, res, next) {
        var BuildingSchema = models.get(req.session.lastDb, 'building', buildingSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;

        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };
        
        BuildingSchema.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }
            
            var historyOptions = {
                contentType: 'BUILDING',
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
        var BuildingSchema = models.get(req.session.lastDb, 'building', buildingSchema);
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
        var contentType = data.contentType || 'building';
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
            sort = {'name': -1};
        }   

        BuildingSchema.aggregate([     

            {
                $lookup: {
                    from        : 'Customers',
                    localField  : 'customerId',
                    foreignField: '_id',
                    as          : 'customerId'
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
                    name            : 1,
                    projectManager  : 1,
                    customerId      : {$arrayElemAt: ['$customerId', 0]},
                    totalAmount     : 1,
                    paidAmount      : 1,
                    totalLoan       : 1,
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
                    name            : '$root.name',
                    projectManager  : '$root.projectManager',
                    customerId      : '$root.customerId',
                    totalAmount     : '$root.totalAmount',
                    paidAmount      : '$root.paidAmount',
                    totalLoan       : '$root.totalLoan',
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
                for(var i = 0; i < result.length; i++){
                    result[i].receivedAmount = result[i].totalAmount - result[i].paidAmount;
                }

                response.total = count;
                response.data = result;

                res.status(200).send(response);
        });

    };


    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'building', buildingSchema);
        var BuildingContractModel = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var count = 0;

        async.each(ids, function (id, cb) {
            BuildingContractModel.find({projectName : id}, function (err, result) {
            
                if (err) {
                    return next(err);
                }

                if(result.length > 0){
                    count = count + 1;
                    cb();
                }
                else{
                    Model.findByIdAndRemove(id, function (err, building) {
                        if (err) {
                            return err(err);
                        }

                        cb();
                    });
                }
            });
            
        }, function (err) {
            if (err) {
                return next(err);
            }

            if(count>0){
                res.status(400).send({error: '有建材合同已使用此建材工程，无法删除'});
            }
            else{
                res.status(200).send({success: true});
            }
        });
    };


    this.remove = function (req, res, next) {
        var _id = req.params._id;

        models.get(req.session.lastDb, 'building', buildingSchema).findByIdAndRemove(_id, function (err, building) {
            if (err) {
                return next(err);
            }

            res.send(200, {success: 'Success removed'});
        });
    };

    this.getBuildings = function (req, res, next) {
        var response = {};
        response.data = [];
        
        models.get(req.session.lastDb, 'buildingContract', buildingContractSchema).find({})
            .populate('projectName' , '_id name')
            .exec(function (err, result) {
            
                if (err) {
                    return next(err);
                }
                
                for(var i = 0; i<result.length; i++){
                    response.data.push(result[i].projectName);
                }

                res.send(response);
            });
    };

    this.getCustomers = function (req, res, next) {
        var response = {};
        response.data = [];
        models.get(req.session.lastDb, 'Customers', CustomerSchema).find({}, 'name.first name.last', function (err, result) {
            
            if (err) {
                return next(err);
            }

            response.data = result;
            res.send(response);
        });
    };

};

module.exports = Module;
