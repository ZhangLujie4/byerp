var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

var safetyManApprove = function (models) {
    'use strict';

    var safetyManagementSchema = mongoose.Schemas.safetyManagement;
    var userSchema = mongoose.Schemas.User;
    var employeeSchema = mongoose.Schemas.Employees;
    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');


    this.putchBulk = function(req, res, next){
        var body = req.body;
        var uId = req.session.uId;
        var dbName = req.session.lastDb;
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var data = {};
        console.log(body);
        // CertificateModel.findByIdAndUpdate(id, {$set: data}, {new: true}, function (err, result) {
        //     if (err) {
        //         return next(err);
        //     }

        // });
                

        res.status(200).send({success: 'updated'});
    };

    this.patch = function (req, res, next) {
        var body = req.body;
        var id = req.params._id;
        var uId = req.session.uId;
        var dbName = req.session.lastDb;
        var safetyManagementModel = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);
        var employeeModel = models.get(req.session.lastDb, 'Employees', employeeSchema);
        var data = {};
        var date = moment();

        var status = body.status;
        var approve = body.approve;
        if(approve){
            if(status == 'new'){
                employeeModel.aggregate([
                    { 
                        $match: {
                            jobType: '副总'
                        }  
                    },
                    {
                        $project: {
                            _id : 1
                        }
                    }
                ], function(err, result){
                    if(err){
                        return next(err);
                    }
                    data = {
                        approveMan: result[0]._id,
                        editedBy:{
                            user: uId,
                            date: date
                        },
                        status: 'In Progress'
                    };
                    safetyManagementModel.findByIdAndUpdate(id, {$set: data}, {new: true}, function(err, r){
                        if(err){
                            return next(err);
                        }
                        res.status(200).send({success: 'Approved'});
                    });
                });
            }
            else if(status == 'In Progress'){
                data = {
                    approveMan: null,
                    editedBy  : {
                        user: uId,
                        date: date
                    },
                    status: 'done'
                }
                safetyManagementModel.findByIdAndUpdate(id, {$set: data}, {new: true}, function(err, result){
                    if(err){
                        return next(err);
                    }
                    res.status(200).send({success: 'Approved'});
                });
            }
        }
        else{
            data = {
                approveMan: null,
                editedBy  : {
                    user: uId,
                    date: date
                },
                status: 'Cancelled'
            }
            safetyManagementModel.findByIdAndUpdate(id, {$set: data}, {new: true}, function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send({success: 'UnApproved'});
            });
        }

    };

    this.getList = function (req, res, next) {
        var safetyManagementModel = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);
        var userModel = models.get(req.session.lastDb, 'Users', userSchema);
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var keySort;
        var uId = req.session.uId;
        if (data.sort) {
            keySort = Object.keys(data.sort)[0];
            data.sort[keySort] = parseInt(data.sort[keySort], 10);
            sort = data.sort;
        } else {
            sort = {'createdBy.date': -1};
        }
        userModel.aggregate([
            {
                $match: {
                    _id: objectId(uId)
                }
            },
            {
                $project:{
                    relatedEmployee: 1
                }
            }
        ], function(err, empId){
            if(err){
                return next(err);
            }
            var eId = empId[0].relatedEmployee;
            safetyManagementModel.aggregate([
                {
                    $match: {
                        approveMan: objectId(eId),
                        $or: [
                            {
                                status    : 'new'
                            },
                            {
                                status    : 'In Progress'
                            }
                        ]
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
                    $group: {
                        _id : null,
                        total: {$sum: 1},
                        root : {$push: '$$ROOT'}
                    }
                },
                {
                    $unwind: '$root'
                },
                {
                    $project: {
                        _id            : '$root._id',
                        'classify.name': '$root.classify.name',
                        content        : '$root.content',
                        attachments    : '$root.attachments',
                        remark         : '$root.remark',
                        'createdBy.user.login': '$root.createdBy.user.login',
                        'createdBy.date'      : '$root.createdBy.date',
                        editedBy       : '$root.editedBy',
                        'approveMan.name'     : '$root.approveMan.name',
                        status         : '$root.status',
                        isApproved     : '$root.isApproved',
                        total          : 1
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
            ], function(err, result){
                if(err){
                    return next(err);
                }
                var response = {};
                var firstElement = result[0];
                var count = firstElement && firstElement.total ? firstElement.total : 0;
                response.total = count;
                response.data = result;
                res.status(200).send(response);
            })
        });

    };




};

module.exports = safetyManApprove;
