var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var scanlogSchema = mongoose.Schemas.scanlog;
var EmployeeSchema = mongoose.Schemas.Employee;
var workPointSchema = mongoose.Schemas.workPoint;
var plantWorkGroupSchema = mongoose.Schemas.plantWorkGroup;
var objectId = mongoose.Types.ObjectId;
var _ = require('lodash');
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

    this.getForView = function (req, res, next){
        var query = req.query;
        var filter = query.filter || {};
        if(filter.departId){
            getByDepartment(req, res, next);
        }
        else if(filter.empId){
            getByEmployee(req, res, next);
        }
        else{
            getList(req, res, next);
        }
    }

    function getList(req, res, next){
        var scanlogModel = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var query = req.query;
        var filter = query.filter || {};

        var paginationObject = pageHelper(query);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var date = filter&&filter.startDate ? new Date(filter.startDate.value) : new Date();
        var datekey = date.getFullYear()*100 + date.getMonth()+1;  

        scanlogModel.aggregate([
            {
                $lookup: {
                    from: 'plantWorkGroup',
                    localField: 'workGroup',
                    foreignField: '_id',
                    as: 'workGroup'
                }
            },
            {
                $project: {
                    workGroup: {$arrayElemAt: ['$workGroup', 0]},
                    price: 1,
                    scantime: 1
                }
            },
            {
                $project: {
                    'workGroup.leader': '$workGroup.leader',
                    price: 1,
                    scantime: {$add: [{$multiply: [{$year: '$scantime'}, 100]}, {$multiply: [{$month: '$scantime'}]}]},
                }
            },
            {
                $match: {
                    scantime: datekey
                }
            },
            {
                $lookup: {
                    from: 'Employees',
                    localField: 'workGroup.leader',
                    foreignField: '_id',
                    as: 'workGroup.leader'
                }
            },
            {
                $project: {
                    'workGroup.leader': {$arrayElemAt: ['$workGroup.leader', 0]},
                    price: 1,
                    scantime: 1
                }
            },
            {
                $project: {
                    'workGroup.leader.department': '$workGroup.leader.department',
                    price: 1,
                    scantime: 1
                }
            },
            {
                $lookup: {
                    from: 'Department',
                    localField: 'workGroup.leader.department',
                    foreignField: '_id',
                    as: 'workGroup.leader.department'
                }
            },
            {
                $project: {
                    'workGroup.leader.department': {$arrayElemAt: ['$workGroup.leader.department', 0]},
                    price: 1,
                    scantime: 1
                }
            },
            {
                $project: {
                    'workGroup.leader.department.name': 1,
                    'workGroup.leader.department._id': 1,
                    price: 1,
                    scantime: 1
                }
            },
            {
                $group: {
                    _id: '$workGroup.leader.department._id',
                    totalPrice: {$sum: '$price'},
                    departmentName: {$first: '$workGroup.leader.department.name'},
                    scantime: {$first: '$scantime'}
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
                    _id: '$root._id',
                    totalPrice: '$root.totalPrice',
                    departmentName: '$root.departmentName',
                    scantime: '$root.scantime',
                    total: 1
                }
            },
            {
                $skip: skip            
            },
            {
                $limit: limit
            }
        ],function(err, result){
            if(err){
                return next(err);
            }
            var count = result[0]&&result[0].total ? result[0].total : 0;

            var response = {
                total: count,
                data: result
            }
            res.status(200).send(response);
        })
    };

    function getByDepartment(req, res, next){
        // var id = req.params.id;
        // var datekey = parseInt(id.substring(0, 6));
        // var depId = id.substring(6);
        var scanlogModel = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var EmployeeModel = models.get(req.session.lastDb, 'Employees', EmployeeSchema);
        var workPointModel = models.get(req.session.lastDb, 'workPoint', workPointSchema);
        var query = req.query;
        var filter = query.filter || {};
        var date = filter&&filter.startDate ? new Date(filter.startDate.value) : new Date();
        var datekey = date.getFullYear()*100 + date.getMonth()+1;  
        var depId = filter.departId? filter.departId : null;
        var paginationObject = pageHelper(query);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        console.log(limit, skip);

        function getEach(callback){
            scanlogModel.aggregate([
                {
                    $lookup: {
                        from: 'plantWorkGroup',
                        localField: 'workGroup',
                        foreignField: '_id',
                        as: 'workGroup'
                    }
                },
                {
                    $project: {
                        workGroup: {$arrayElemAt: ['$workGroup', 0]},
                        price: 1,
                        scantime: 1,
                        datekey: {$add: [{$multiply: [{$year: '$scantime'}, 100]}, {$month: '$scantime'}]}
                    }
                },
                {
                    $match: {
                        datekey: datekey
                    }
                },
                {
                    $project: {
                        'workGroup.leader': '$workGroup.leader',
                        'workGroup.members': '$workGroup.members',
                        price: 1,
                        scantime: 1
                    }
                }
            ], function(err, result){
                if(err){
                    return callback(err);
                }
                callback(null, result);
            });
        };

        function calc(scanlogs, callback){
            var wageArray = [];
            async.each(scanlogs, function(scanlog, asyncCb){
                scanlog.workGroup.members.push(scanlog.workGroup.leader);
                var members = scanlog.workGroup.members;
                var price = scanlog.price;
                var date = scanlog.scantime;
                async.map(members, function(member, cb){
                    workPointModel.aggregate([
                        {
                            $match:{
                                employee: objectId(member),
                                date: {$lte: date}
                            }
                        },
                        {
                            $lookup: {
                                from: 'Employees',
                                localField: 'employee',
                                foreignField: '_id',
                                as: 'employee'
                            }
                        },
                        {
                            $project: {
                                employee: {$arrayElemAt: ['$employee', 0]},
                                date: 1,
                                point: 1
                            }
                        },
                        {
                            $project: {
                                'employee._id': '$employee._id',
                                'employee.name': '$employee.name',
                                date: 1,
                                point: 1
                            }
                        },
                        {
                            $sort: {
                                date: -1
                            }
                        }
                    ],function(err, employeeInfo){
                        if(err){
                            return cb(err)
                        }
                        if(employeeInfo.length == 0){
                            var error = new Error('有员工在扫码前没有设置工分');
                            error.status = 400;
                            cb(error);
                        }
                        else{
                            var data = {
                                _id: employeeInfo[0].employee._id,
                                name: employeeInfo[0].employee.name,
                                workPoints: employeeInfo[0].point|| 1
                            }
                            cb(null, data);
                        }
                      })
                }, function(err, result){
                    if(err){
                        return asyncCb(err);
                    }
                    var total = 0;
                    for(var i=0; i<result.length; i++){
                        total = total + result[i].workPoints; 
                    }
                    for(var j=0; j<result.length; j++){
                        var rate = result[j].workPoints/total;
                        var data = {
                            _id: result[j]._id,
                            name: result[j].name,
                            price: price*rate,
                            datekey: datekey
                        }
                        var flag = false;
                        for(var k=0; k<wageArray.length; k++){
                            if(wageArray[k]._id.toString() == data._id.toString()){
                                flag = true;
                                wageArray[k].price += data.price;
                            }
                        }
                        if(!flag){
                            wageArray.push(data);
                        }

                    }
                    asyncCb(null);
                });
            }, function(err){
                if(err){
                    return callback(err);
                }
                callback(null,wageArray);
            })
        };

        async.waterfall([getEach, calc], function(err, result){
            if(err){
                return next(err);
            }
            var response = {
                total: result.length,
                data: result.slice(skip, skip+limit)
            }
            res.status(200).send(response);
        })
    };

    function getByEmployee(req, res, next){
        var query = req.query;
        // var datekey = parseInt(query.datekey);
        // var empId = query.id;
        var scanlogModel = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var EmployeeModel = models.get(req.session.lastDb, 'Employees', EmployeeSchema);
        var plantWorkGroupModel = models.get(req.session.lastDb, 'plantWorkGroup', plantWorkGroupSchema);
        var workPointModel = models.get(req.session.lastDb, 'workPoint', workPointSchema);
        var filter = query.filter || {};
        var paginationObject = pageHelper(query);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var date = filter&&filter.startDate ? new Date(filter.startDate.value) : new Date();
        var datekey = date.getFullYear()*100 + date.getMonth()+1;  
        var empId = filter.empId? filter.empId : null;

        function getScanlog(cb){
            scanlogModel.aggregate([
                {
                    $lookup: {
                        from: 'plantWorkGroup',
                        localField: 'workGroup',
                        foreignField: '_id',
                        as: 'workGroup'
                    }
                },
                {
                    $lookup: {
                        from: 'barCode',
                        localField: 'barCode',
                        foreignField: '_id',
                        as: 'barCode'
                    }
                },
                {
                    $project: {
                        workGroup: {$arrayElemAt: ['$workGroup', 0]},
                        price: 1,
                        barCode: {$arrayElemAt: ['$barCode', 0]},
                        scantime: 1,
                        datekey: {$add: [{$multiply: [{$year: '$scantime'}, 100]}, {$month: '$scantime'}]}
                    }
                },
                {
                    $project: {
                        'workGroup._id'   : '$workGroup._id',
                        'workGroup.leader': '$workGroup.leader',
                        'workGroup.members': '$workGroup.members',
                        'workGroup.workCentre': '$workGroup.workCentre',
                        price: 1,
                        barCode: 1,
                        scantime: 1,
                        datekey: 1
                    }
                },
                {
                    $unwind: {
                        path: '$workGroup.members',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    {
                                        'workGroup.leader': objectId(empId)
                                    },
                                    {
                                        'workGroup.members': objectId(empId)
                                    }
                                ]
                            },
                            {
                                datekey: datekey
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'aluveneerOrders',
                        localField: 'barCode.orderRowId',
                        foreignField: '_id',
                        as: 'barCode.orderRowId'
                    }
                },
                {
                    $lookup: {
                        from: 'workCentres',
                        localField: 'workGroup.workCentre',
                        foreignField: '_id',
                        as: 'workGroup.workCentre'
                    }
                },
                {
                    $project: {
                        'workGroup._id'   : 1,
                        'workGroup.leader': 1,
                        'workGroup.members': 1,
                        'workGroup.workCentre': {$arrayElemAt: ['$workGroup.workCentre', 0]},
                        price: 1,
                        scantime: 1,
                        'barCode.barId': '$barCode.barId',
                        'barCode.curWorkCentre': '$barCode.curWorkCentre',
                        'barCode.orderRowId': {$arrayElemAt: ['$barCode.orderRowId', 0]}
                    }
                },
                {
                    $project: {
                        'workGroup._id'   : 1,
                        'workGroup.leader': 1,
                        'workGroup.members': 1,
                        'workGroup.workCentre._id': '$workGroup.workCentre._id',
                        'workGroup.workCentre.name': '$workGroup.workCentre.name',
                        price: 1,
                        scantime: 1,
                        'barCode.barId': '$barCode.barId',
                        'barCode.orderRowId.projectName': '$barCode.orderRowId.projectName',
                        'barCode.orderRowId.cgdh': '$barCode.orderRowId.cgdh'
                    }
                },
                {
                    $lookup: {
                        from: 'building',
                        localField: 'barCode.orderRowId.projectName',
                        foreignField: '_id',
                        as: 'barCode.orderRowId.projectName'
                    }
                },
                {
                    $project: {
                        'workGroup._id'   : 1,
                        'workGroup.leader': 1,
                        'workGroup.members': 1,
                        'workGroup.workCentre._id': 1,
                        'workGroup.workCentre.name': 1,
                        price: 1,
                        scantime: 1,
                        'barCode.barId': 1,
                        'barCode.orderRowId.projectName': {$arrayElemAt:['$barCode.orderRowId.projectName', 0]},
                        'barCode.orderRowId.cgdh': '$barCode.orderRowId.cgdh'
                    }
                },
                {
                    $project: {
                        'workGroup._id'   : 1,
                        'workGroup.leader': 1,
                        'workGroup.members': 1,
                        'workGroup.workCentre._id': 1,
                        'workGroup.workCentre.name': 1,
                        price: 1,
                        scantime: 1,
                        'barCode.barId': 1,
                        'barCode.orderRowId.projectName.name': '$barCode.orderRowId.projectName.name',
                        'barCode.orderRowId.cgdh': '$barCode.orderRowId.cgdh'
                    }
                }
            ],function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            });
        }
        
        function calc(scanlogs, cb){
            async.map(scanlogs, function(scanlog, asyncCb){
                var scantime = scanlog.scantime;
                var workGroupId = scanlog.workGroup._id;
                var price = scanlog.price;
                plantWorkGroupModel.findById(workGroupId, function(err, groupInfo){
                    if(err){
                        return asyncCb(err)
                    }
                    var members = groupInfo.members
                    members.push(groupInfo.leader);
                    async.map(members, function(member, asyncCb2){
                         workPointModel.aggregate([
                            {
                                $match:{
                                    employee: objectId(member),
                                    date: {$lte: scantime}
                                }
                            },
                            {
                                $lookup: {
                                    from: 'Employees',
                                    localField: 'employee',
                                    foreignField: '_id',
                                    as: 'employee'
                                }
                            },
                            {
                                $project: {
                                    employee: {$arrayElemAt: ['$employee', 0]},
                                    date: 1,
                                    point: 1
                                }
                            },
                            {
                                $project: {
                                    'employee._id': '$employee._id',
                                    'employee.name': '$employee.name',
                                    date: 1,
                                    point: 1
                                }
                            },
                            {
                                $sort: {
                                    date: -1
                                }
                            }
                        ],function(err, employeeInfo){
                            if(err){
                                return asyncCb2(err)
                            }
                            if(employeeInfo.length == 0){
                                var error = new Error('有员工在扫码前没有设置工分');
                                error.status = 400;
                                asyncCb2(error);
                            }
                            else{
                                var data = {
                                    _id: employeeInfo[0].employee._id,
                                    name: employeeInfo[0].employee.name,
                                    workPoints: employeeInfo[0].point|| 1
                                }
                                asyncCb2(null, data);
                            }
                          })
                    }, function(err, workPointResult){
                        if(err){
                            return asyncCb(err)
                        }
                        var total = 0;
                        var curPoint = 0;
                        for(var i=0; i<workPointResult.length; i++){
                            total = total + workPointResult[i].workPoints; 
                            if(workPointResult[i]._id.toString() == empId.toString()){
                                curPoint = workPointResult[i].workPoints;
                            }
                        }
                        var rate = curPoint/total;
                        var money = price*rate;
                        scanlog.rate = rate;
                        scanlog.money = money;
                        asyncCb(null, scanlog);
                    })
                })
            }, function(err, result){
                if(err){
                    cb(err);
                }
                cb(null, result);
            })
        }

        async.waterfall([getScanlog, calc], function(err, result){
            if(err){
                return next(err);
            }
            var response = {
                total: result.length,
                data: result.slice(skip, skip+limit)
            }
            res.status(200).send(response);
        })
    };

};

module.exports = Module;
