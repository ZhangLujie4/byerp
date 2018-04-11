var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var buildingContractSchema = mongoose.Schemas.BuildingContract;
var buildingSchema = mongoose.Schemas.Building;
var CustomerSchema = mongoose.Schemas.Customer;
var ProductSchema = mongoose.Schemas.Products;
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

    this.createBuildingContract = function (req, res, next) {
        var body = req.body;
        var buildingContract;
        var error;
        var BuildingContractModel = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var CustomerModel = models.get(req.session.lastDb, 'Customers', CustomerSchema);
        var BuildingModel = models.get(req.session.lastDb, 'building', buildingSchema);

        var uId = req.session.uId;
        var date = new Date();
        body.status = 'new';
              
        body.createdBy = {
            user: uId,
            date: date
        };
        var totalAmount;

        buildingContract = new BuildingContractModel(body);
        buildingContract.save(function (err, result) {
            if (err) {
                return next(err);
            }
            BuildingModel.find({_id : body.projectName}) .exec( function (err, result1) {
                if (err) {
                    return next(err);
                }
                
                totalAmount = Number(result1[0].totalAmount) + Number(body.projectCost);
                
                BuildingModel.findByIdAndUpdate(body.projectName, {totalAmount : totalAmount}, function (err, result2) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send(result2);
                });
            });
                       
        });

    };


    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var headers = req.headers;
        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'buildingContract';
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

                res.status(200).send({success: '建材合同附件已上传', data: response});
            });
        });
    };

    this.buildingContractUpdate = function (req, res, next) {
        var BuildingContractSchema = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var dbName = req.session.lastDb;
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };

        BuildingContractSchema.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }

            var historyOptions = {
                contentType: 'BUILDINGCONTRACT',
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
        var BuildingContractSchema = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
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
        var contentType = data.contentType || 'buildingContract';
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

        BuildingContractSchema.find(optionsObject)
            .populate('projectName', '_id name')
            .populate('customer', '_id name')
            .populate('createdBy.user')
            .populate('editedBy.user')
            .populate('inventory.product', '_id name')
            .skip(skip)
            .limit(limit)
            .sort(sort)           
            .exec(function (err, result) {
                var count;
                var response = {};

                if (err) {
                    return next(err);
                }

                count = result.length || 0;

                response.total = count;
                response.data = result;

                res.status(200).send(response);
        });

    };


    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var DesignRecModel = models.get(req.session.lastDb, 'designRec', designRecSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var count = 0;

        async.each(ids, function (id, cb) {
            Model.findById(id , function (err, result) {
                if (err) {
                    return next(err);
                }

                DesignRecModel.find({projectName : result.projectName}, function (err, designRec) {
                    if (err) {
                        return next(err);
                    }

                    if(designRec.length > 0){
                        count = count + 1;
                        cb();
                    }
                    else{
                        Model.findByIdAndRemove(id, function (err, buildingContract) {
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
                res.status(400).send({error: '该合同已有客户订单数据，无法删除'});
            }
            else{
                res.status(200).send({success: true});
            }
        });
    };


    this.remove = function (req, res, next) {
        var _id = req.params._id;

        models.get(req.session.lastDb, 'buildingContract', buildingContractSchema).findByIdAndRemove(_id, function (err, buildingContract) {
            if (err) {
                return next(err);
            }

            res.send(200, {success: 'Success removed'});
        });
    };

    this.getCustomers = function (req, res, next) {
        var response = {};
        response.data = [];
        var building = req.query.building || req.params.building ;

        models.get(req.session.lastDb, 'building', buildingSchema).findOne({_id : building}, function (err, buildingResult) {
            
            if (err) {
                return next(err);
            }
            
            else{

                models.get(req.session.lastDb, 'Customers', CustomerSchema).findOne({_id : buildingResult.customerId}, function (err, result) {
                
                    if (err) {
                        return next(err);
                    }

                    response.data = result;
                    res.send(response);
                });
            }
        });

    };

    this.getSoldProducts = function (req, res, next) {
        var DesignRecModel = models.get(req.session.lastDb, 'designRec', designRecSchema);
        var response = {};
        response.data = [];
        var projectName = req.query.projectName;

        DesignRecModel.find({projectName : projectName}, function (err, designRec) {
            if (err) {
                return next(err);
            }

            if(designRec.length > 0){
                var temp = [];
                temp[0] = {};
                temp[0].name = '已存在客户订单,无法修改,请勿选择';
                response.data = temp;
                res.send(response);
            }
            else{
                models.get(req.session.lastDb, 'Product', ProductSchema).find({canBeSold: true}, function (err, result) {
                    
                    if (err) {
                        return next(err);
                    }

                    response.data = result;
                    res.send(response);
                });
            }
        });
    };

    this.getBuildings = function (req, res, next) {
        var response = {};
        response.data = [];
        models.get(req.session.lastDb, 'building', buildingSchema).find({}, function (err, result) {
            
            if (err) {
                return next(err);
            }

            response.data = result;
            res.send(response);
        });
    };
 
};

module.exports = Module;
