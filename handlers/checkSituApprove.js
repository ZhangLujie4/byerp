var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

var checkSituApprove = function (models) {
    'use strict';

    var checkSituationSchema = mongoose.Schemas.checkSituation;
    var userSchema = mongoose.Schemas.User;
    var employeeSchema = mongoose.Schemas.Employees;
    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');


    this.putchBulk = function(req, res, next){
        var body = req.body;
        var uId = req.session.uId;
        var dbName = req.session.lastDb;
        var checkSituationModel = models.get(req.session.lastDb, 'checkSituation', checkSituationSchema);
        var employeeModel = models.get(req.session.lastDb, 'Employees', employeeSchema);
        var data = {};
        var date = moment();
        var timeStamp = body.timeStamp;
        var approve = body.approve;
        var status = body.status;
        console.log(body);
        data.editedBy = {
            user: uId,
            date: date
        };

        function getData(callback){
            checkSituationModel.aggregate([
                {
                    $match:{
                        timeStamp: timeStamp
                    }
                },
                {
                    $project: {
                        _id : 1
                    }
                }
            ], function(err, result){
                if(err){
                    return callback(err);
                }
                callback(null, result);
            });
        }

        function updateData(checkData, callback){
            console.log(data);
            async.each(checkData, function(item, cb){
                var id = item._id;
                checkSituationModel.findByIdAndUpdate(id, data, function(err, result){
                    if(err){
                        return cb(err);
                    }
                    cb();
                })
            }, function(err){
                if(err){
                    return callback(err);
                }
                callback(null, 'updated')
            });
        }


        if(approve){
            if(status == 'new'){
                data.status = 'In Progress';
                employeeModel.aggregate([
                    {
                        $match:{
                            jobType: '副总'
                        }
                    },
                    {
                        $project: {
                            _id: 1
                        }
                    }
                ], function(err, empId){
                    if(err){
                        return next(err);
                    }
                    data.approveMan = empId[0]._id;
                    console.log(1);
                    async.waterfall([getData, updateData], function(err, reuslt){
                        if(err){
                            return next(err);
                        }
                        console.log(2);
                        res.status(200).send({success: 'updated'});
                    });
                })
            }
            else if(status == 'In Progress'){
                data.status = 'done';
                data.approveMan = null;
                async.waterfall([getData, updateData], function(err, reuslt){
                    if(err){
                        return next(err);
                    }
                    res.status(200).send({success: 'updated'});
                });
            }
        }
        else{
            data.status = 'Cancelled';
            data.approveMan = null;
            async.waterfall([getData, updateData], function(err, reuslt){
                if(err){
                    return next(err);
                }
                res.status(200).send({success: 'updated'});
            });
        }

        
        
                
    };

    this.patch = function (req, res, next) {
        var body = req.body;
        var id = req.params._id;
        var uId = req.session.uId;
        var dbName = req.session.lastDb;
        var safetyManagementModel = models.get(req.session.lastDb, 'safetyManagement', safetyManagementSchema);
        var employeeModel = models.get(req.session.lastDb, 'Employees', empolyeeSchema);
        var data = {};
        var date = moment();

        var status = body.status;
        var approve = body.approve;
        console.log(body);
        res.status(200).send('updated');
        // if(approve){
        //     if(status == 'new'){
        //         employeeModel.aggregate([
        //             { 
        //                 $match: {
        //                     jobType: '副总'
        //                 }  
        //             },
        //             {
        //                 $project: {
        //                     _id : 1
        //                 }
        //             }
        //         ], function(err, result){
        //             if(err){
        //                 return next(err);
        //             }
        //             data = {
        //                 approveMan: result[0]._id,
        //                 editedBy:{
        //                     user: uId,
        //                     date: date
        //                 },
        //                 status: 'In Progress'
        //             };
        //             safetyManagementModel.findByIdAndUpdate(id, {$set: data}, {new: true}, function(err, r){
        //                 if(err){
        //                     return next(err);
        //                 }
        //                 res.status(200).send({success: 'Approved'});
        //             });
        //         });
        //     }
        //     else if(status == 'In Progress'){
        //         data = {
        //             approveMan: null,
        //             editedBy  : {
        //                 user: uId,
        //                 date: date
        //             },
        //             status: 'done'
        //         }
        //         safetyManagementModel.findByIdAndUpdate(id, {$set: data}, {new: true}, function(err, result){
        //             if(err){
        //                 return next(err);
        //             }
        //             res.status(200).send({success: 'Approved'});
        //         });
        //     }
        // }
        // else{
        //     data = {
        //         approveMan: null,
        //         editedBy  : {
        //             user: uId,
        //             date: date
        //         },
        //         status: 'Cancelled'
        //     }
        //     safetyManagementModel.findByIdAndUpdate(id, {$set: data}, {new: true}, function(err, result){
        //         if(err){
        //             return next(err);
        //         }
        //         res.status(200).send({success: 'UnApproved'});
        //     });
        // }

    };

    this.getList = function (req, res, next) {
        var checkSituationModel = models.get(req.session.lastDb, 'checkSituation', checkSituationSchema);
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
            checkSituationModel.aggregate([
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
                    $lookup: {
                        from: 'engineerInfo',
                        localField: 'engineerInfo',
                        foreignField: '_id',
                        as: 'engineerInfo'
                    }
                },
                {
                    $lookup:{
                        from       : 'User',
                        localField : 'createdBy.user',
                        foreignField: '_id',
                        as         : 'createdBy.user' 
                    }
                },
                {
                    $lookup:{
                        from       : 'Employees',
                        localField : 'approveMan',
                        foreignField: '_id',
                        as         : 'approveMan' 
                    }
                }, 
                {
                    $lookup:{
                        from       : 'managementRule',
                        localField : 'rule',
                        foreignField: '_id',
                        as         : 'rule'
                    }
                },
                {
                    $project: {
                        engineerInfo: {$arrayElemAt: ['$engineerInfo', 0]},
                        year        : 1,
                        month       : 1,
                        rule        : {$arrayElemAt: ['$rule', 0]},
                        rectification: 1,
                        penalty     : 1,
                        focus       : 1,
                        remark      : 1,
                        attachments : 1,
                        inspector   : 1,
                        inspectDate : 1,
                        'createdBy.user': {$arrayElemAt: ['$createdBy.user', 0]},
                        'createdBy.date': 1,
                        approveMan    : {$arrayElemAt: ['$approveMan', 0]},
                        status      : 1,
                        timeStamp   : 1
                    }
                },
                {
                    $project: {
                        'engineerInfo.name': '$engineerInfo.name',
                        'engineerInfo._id' : '$engineerInfo._id',
                        year               : 1,
                        month              : 1,
                        rule               : 1,
                        rectification      : 1,
                        penalty            : 1,
                        focus              : 1,
                        remark             : 1,
                        attachments        : 1,
                        inspector          : 1,
                        inspectDate        : 1,
                        'createdBy.user'   : 1,
                        'createdBy.date'   : 1,
                        'approveMan.name'  : '$approveMan.name',
                        'approveMan._id'   : '$approveMan._id',
                        status             : 1,
                        timeStamp          : 1
                    }
                },
                {
                    $group: {
                        _id: '$timeStamp',
                        root: {$push: '$$ROOT'}
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
                // var response = {};
                // var firstElement = result[0];
                // var count = firstElement && firstElement.total ? firstElement.total : 0;
                // response.total = count;
                // response.data = result;
                res.status(200).send(result);
            })
        });

    };




};

module.exports = checkSituApprove;
