var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

var stampApprove = function (models) {
    'use strict';

    var userSchema = mongoose.Schemas.User;
    var EmployeeSchema = mongoose.Schemas.Employee;
    var DepartmentSchema = mongoose.Schemas.Department;
    var safetyManagementSchema = mongoose.Schemas.safetyManagement;
    var safetyManClassifySchema = mongoose.Schemas.safetyManClassify;

    var async = require('async');
    var path = require('path');
    var RESPONSES = require('../constants/responses');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();

    this.create = function (req, res, next) {
        var safetyManagementModel = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);
        var departmentModel = models.get(req.session.lastDb, 'Department', DepartmentSchema);
        var body = req.body;
        var uId = req.session.uId;
        var date = moment();
        body.isApproved = false;
        body.createdBy = {
            user: uId,
            date: date
        };
        body.status = 'new';
        
        departmentModel.aggregate([
            {
                $match: {
                    name: '工程部'
                }
            },
            {
                $project: {
                    departmentManager : 1
                }
            }
        ],function(err, result){
            if(err){
                return next(err);
            }
            body.approveMan = result[0].departmentManager;
            console.log(body);
            var safetyManagement = new safetyManagementModel(body);

            safetyManagement.save(function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({success: result});
            });
        });

    };

    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);
        var headers = req.headers;

        var id = headers.modelid || 'empty';

        var contentType = headers.modelname || 'safetyManagement';

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

                res.status(200).send({success: 'Customers updated success', data: response});
            });
        });
    };

    this.patchBulk = function (req, res, next) {
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var body = req.body;

        async.each(body, function (data, cb) {
            var id = data._id;

            delete data._id;
            stampApplicationModel.findByIdAndUpdate(id, {$set: data}, {new: true}, cb);
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'updated'});
        });
    };

    this.update = function(req, res, next){
        var safetyManagementModel = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);
        var data = req.body;
        var id = req.params.id;
        var uId = req.session.uId;
        var date = moment();
        var editedBy = {
            user: uId,
            date: date
        };
        var dataAll = {};
        safetyManagementModel.findByIdAndUpdate(id, {status: 'deleted'}, {new: true}, function(err, result){
            if(err){
                return next(err);
            }

            dataAll = {
                classify: data.classify,
                content : data.content,
                remark  : data.remark,
                isApproved: result.isApproved,
                approveMan: result.approveMan,
                createdBy : {
                    user: result.createdBy.user,
                    date: result.createdBy.date
                },                
                attachments: result.attachments,
                isDelete  : false,
                editedBy  : editedBy
            };       

            var safetyManagement = new safetyManagementModel(dataAll);
            safetyManagement.save(function(err, result2){
                if(err){
                    return next(err);
                }
                res.status(200).send({success: result2});
            });
        });

 
    };

    this.getForView = function (req, res, next) {
        var safetyManagement = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);
        var safetyManClssify = models.get(req.session.lastDb, 'safetyManClassify', safetyManClassifySchema);
        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType;
        var uId = req.session.uId;
        // var sort = data.sort || {};
        var sort;
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var optionsObject = {};
        var parallelTasks;
        var keySort;

        var filterMapper = new FilterMapper();
        if (filter && typeof filter === 'object') {
            optionsObject = filterMapper.mapFilter(filter, contentType); // caseFilter(filter);
        }

        if (data.sort) {
            keySort = Object.keys(data.sort)[0];
            data.sort[keySort] = parseInt(data.sort[keySort], 10);
            sort = data.sort;
        } else {
            sort = {'createdBy.date': 1};
        }

        var getTotal = function(pCb){
            safetyManagement.count(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        var getData = function(pCb){
            safetyManagement.aggregate([
                {
                    $match: {
                        status: {
                            $ne: 'deleted'
                        }
                    }
                },
                {
                    $lookup:{
                        from        : 'Employees',
                        localField  : 'approveMan',
                        foreignField: '_id',
                        as          : 'approveMan'
                    }
                },
                {
                    $lookup:{
                        from        : 'Users',
                        localField  : 'createdBy.user',
                        foreignField: '_id',
                        as          : 'createdBy.user'
                    }
                },
                {
                    $lookup:{
                        from        : 'safetyManClassify',
                        localField  : 'classify',
                        foreignField: '_id',
                        as          : 'classify'
                    }
                },
                {
                    $project:{
                        classify    : {$arrayElemAt: ['$classify', 0]},
                        content     : 1,
                        attachments : 1,
                        remark      : 1,
                        'createdBy.user'   : {$arrayElemAt: ['$createdBy.user', 0]},
                        'createdBy.date'   : 1,
                        editedBy    : 1,
                        approveMan  : {$arrayElemAt: ['$approveMan', 0]},
                        status      : 1,
                        isApproved  : 1
                    }
                },
                {
                    $project: {
                        'classify._id'     : '$classify._id',
                        'classify.name'    : '$classify.name',
                        content     : 1,
                        attachments : 1,
                        remark      : 1,
                        'createdBy.user.login': '$createdBy.user.login',
                        'createdBy.date' : 1,
                        editedBy    : 1,
                        'approveMan.name'  : '$approveMan.name',
                        status      : 1,
                        isApproved  : 1
                    }
                },
                {
                    $sort: sort
                },
                {
                    $limit: limit
                },
                {
                    $skip: skip
                }
            ], function(err, result){
                if(err){
                    return next(err);
                }
                pCb(null, result);
            });
        };

        async.parallel([getTotal, getData], function(err, result){
            if(err){
                return next(err);
            }
            var count;
            var response = {};

            count = result[0] || 0;

            response.total = count;
            response.data = result[1];

            res.status(200).send(response);
        });
    };

    this.getClassifyDd = function (req, res, next) {
        var safetyManClassify = models.get(req.session.lastDb, 'safetyManClassify', safetyManClassifySchema);
        safetyManClassify.aggregate([
            {
                $project: {
                    name: 1
                }
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.createClassify = function(req, res, next){
        var safetyManClassifyModel = models.get(req.session.lastDb, 'safetyManClassify', safetyManClassifySchema);
        var body = req.body;
        console.log(body);
        var data = {
            name: body.classify
        }
        var safetyManClassify = new safetyManClassifyModel(data);
        safetyManClassify.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.remove = function (req, res, next) {
        var id = req.params._id;
        var safetyManagementModel = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);

        safetyManagementModel.findByIdAndUpdate(id, {status: 'deleted'}, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.bulkRemove = function (req, res, next) {
        var safetyManagementModel = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var date = moment();
        var uId = req.session.uId;
        var editedBy = {
            user: uId,
            date: date
        }
        async.each(ids, function(id, cb){
            safetyManagementModel.findByIdAndUpdate(id, {status: 'deleted', editedBy: editedBy}, {new: true}, cb);
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send({success: 'Deleted'});
        });
    };

};

module.exports = stampApprove;
