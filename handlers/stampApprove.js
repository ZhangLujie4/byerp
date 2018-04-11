var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

var stampApprove = function (models) {
    'use strict';

    var StampSchema = mongoose.Schemas.stamp;
    var stampApplicationSchema = mongoose.Schemas.stampApplication;
    var userSchema = mongoose.Schemas.User;
    var EmployeeSchema = mongoose.Schemas.Employee;
    var DepartmentSchema = mongoose.Schemas.Department;
    var stampApprovalSchema = mongoose.Schemas.stampApproval;

    var async = require('async');
    var path = require('path');
    var RESPONSES = require('../constants/responses');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();

    this.update = function(req, res, next){
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var stampApprovalModel = models.get(req.session.lastDb, 'stampApproval', stampApprovalSchema);
        var data = req.body;
        var id = req.params.id;
        var status = data.status;
        var opinion = data.opinion;
        var isApprove = data.isApprove;
        stampApprovalModel.findById(id).exec(function(err, result){
            if(err){
                return next(err);
            }
            var comment = result.comment;
            var approveMan;
            comment[status].opinion = opinion;

            var d = new Date();
            var localTime = d.getTime(); 
            var localOffset = d.getTimezoneOffset()*60000; 
            var utc = localTime + localOffset;
            var processTotal = result.process.length;
            var isApproved = result.isApproved;
            comment[status].date = new Date(utc + 3600000 * 8);
            if(isApprove){
                comment[status].statusInd = 1;
                status = status + 1;
                if(status == processTotal){
                    approveMan = null;
                    isApproved = true;
                }
                else{
                    approveMan = result.process[status].id;
                    isApproved = false;
                }
                
            }
            else{
                comment[status].statusInd = -1;
                status = -1;
            }

            var updateData = {
                comment: comment,
                status : status,
                approveMan: approveMan,
                isApproved: isApproved
            };

            stampApprovalModel.findByIdAndUpdate(id, updateData, function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send(result);
            });
        });
    };

    this.getForView = function (req, res, next) {
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var stampApprovalModel = models.get(req.session.lastDb, 'stampApproval', stampApprovalSchema);
        var userModel = models.get(req.session.lastDb, 'User', userSchema);
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
            sort = {'level': 1};
        }

        userModel.aggregate([
            {
                $match: {
                    _id: objectId(uId)
                }
            },
            {
                $project: {
                    relatedEmployee: 1
                }
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            var empId = result[0].relatedEmployee;
            stampApprovalModel.aggregate([
                {
                    $match: {
                        approveMan: objectId(empId)
                    }
                },
                {
                    $lookup: {
                        from: 'Employees',
                        localField: 'approveMan',
                        foreignField: '_id',
                        as: 'approveMan'
                    }
                },
                {
                    $lookup: {
                        from: 'stampApplication',
                        localField: 'stampApplication',
                        foreignField: '_id',
                        as: 'stampApplication'
                    }
                },
                {
                    $lookup: {
                        from: 'Stamps',
                        localField: 'stamp',
                        foreignField: '_id',
                        as: 'stamp'
                    }
                },
                {
                    $project: {
                        status      : 1,
                        approveMan  : {$arrayElemAt: ['$approveMan', 0]},
                        stampApplication: {$arrayElemAt: ['$stampApplication', 0]},
                        attachments : 1,
                        comment     : 1,
                        process     : 1,
                        stamp       : {$arrayElemAt: ['$stamp', 0]},
                    }
                },
                {
                    $project: {
                        fileNumber  : '$stampApplication.fileNumber',
                        fileType    : '$stampApplication.fileType',
                        pageNumber  : '$stampApplication.pageNumber',
                        applyDate   : '$stampApplication.applyDate',
                        status      : 1,
                        'approveMan.name'  : '$approveMan.name',
                        'approveMan._id'   : '$approveMan._id',
                        attachments : 1,
                        department  : '$stampApplication.department',
                        applyMan    : '$stampApplication.applyMan',
                        comment     : 1,
                        projectName : '$stampApplication.projectName',
                        process     : 1,
                        'stamp.name'       : '$stamp.name',
                        'stamp._id'        : '$stamp._id',
                    }
                },
                {
                    $lookup: {
                        from: 'Department',
                        localField: 'department',
                        foreignField: '_id',
                        as: 'department'
                    }
                },
                {
                    $lookup: {
                        from: 'Employees',
                        localField: 'applyMan',
                        foreignField: '_id',
                        as: 'applyMan'
                    }
                },
                {
                    $lookup: {
                        from: 'Opportunities',
                        localField: 'projectName',
                        foreignField: '_id',
                        as: 'projectName'
                    }
                },
                {
                    $project: {
                        fileNumber       : 1,
                        fileType         : 1,
                        pageNumber       : 1,
                        applyDate        : 1,
                        status           : 1,
                        attachments      : 1,
                        comment          : 1,
                        process          : 1,
                        department       : {$arrayElemAt: ['$department', 0]},
                        applyMan         : {$arrayElemAt: ['$applyMan', 0]},
                        projectName      : {$arrayElemAt: ['$projectName', 0]},
                        'approveMan._id' : 1,
                        'approveMan.name': 1,
                        'stamp.name'     : 1,
                        'stamp._id'      : 1
                    }
                },
                {
                    $project: {
                        fileNumber       : 1,
                        fileType         : 1,
                        pageNumber       : 1,
                        applyDate        : 1,
                        status           : 1,
                        attachments      : 1,
                        comment          : 1,
                        process          : 1,
                        'department.name': '$department.name',
                        'department._id' : '$department._id',
                        'applyMan.name'  : '$applyMan.name',
                        'applyMan._id'   : '$applyMan._id',
                        'projectName._id': '$projectName._id',
                        'projectName.name': '$projectName.name',
                        'approveMan._id' : 1,
                        'approveMan.name': 1,
                        'stamp.name'     : 1,
                        'stamp._id'      : 1 
                    }
                }
            ], function(err, stampApprovalResult){
                if(err){
                    return next(err);
                }
                res.status(200).send(stampApprovalResult);
            });
        })
        


    };



};

module.exports = stampApprove;
