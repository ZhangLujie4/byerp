var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;

var BusiTrip = function (models) {
    'use strict';

    var busiTripSchema = mongoose.Schemas.busiTrip;
    var empolyeeSchema = mongoose.Schemas.Employees;
    var sequenceSchema = mongoose.Schemas.sequence;
    var userSchema = mongoose.Schemas.User;
    var CONSTANTS = require('../constants/mainConstants.js');
    var departmentArray = CONSTANTS.NOT_DEV_ARRAY;
    var mapObject = require('../helpers/bodyMaper');
    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');

    this.patch = function (req, res, next) {
        var busiTripModel = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var user = models.get(req.session.lastDb, 'Users', userSchema);
        var employee = models.get(req.session.lastDb, 'Employees', empolyeeSchema);
        var id = req.params._id;
        var uId = req.session.uId;
        var data = mapObject(req.body);
        console.log('35',data.isApproved);
        var agree = (data.agree === 'true');
        var isApproved = (data.isApproved === 'true');
        var isafter = (data.isafter === 'true');
        if(agree){
            var empId = data.name;
            employee.aggregate([
                {
                    $match:{
                        _id: objectId(empId)
                    }
                },
                {
                    $project:{
                        department: 1
                    }
                }
            ],function(err,departmentId){
                if(err){
                    next(err);
                }
                var department = departmentId[0].department;
                console.log(departmentArray.indexOf(department.toString()) !== -1);
                console.log('isafter1',data.isafter);
                console.log('isafter',isafter);
                if((departmentArray.indexOf(department.toString()) !== -1)){
                    if(data.status == 1){
                            data.status = 3;
                            delete data.createdBy;
                            delete data._id;

                            employee.aggregate([
                                {
                                    $match: {
                                        jobType: '总经理'
                                    }
                                },{
                                    $project:{
                                        _id: 1
                                    }
                                }
                            ],function(err,ceo){
                                if(err){
                                    return next(err);
                                }
                                data.manager = ceo[0]._id;
                                busiTripModel.findByIdAndUpdate(id, data, {new: true}, function(err){
                                    if(err){
                                        return next(err);
                                    }
                                    res.status(200).send({success: 'updated'});
                                });
                            });
                        }
                    else if(data.status == 3){
                        if(!isApproved){
                            data.status = -2;
                            data.isApproved = true;
                            delete data.createdBy;
                            delete data._id;
                            busiTripModel.findByIdAndUpdate(id, data, {new: true}, function(err){
                                if(err){
                                    return next(err);
                                }
                                res.status(200).send({success: 'updated'});
                            });
                        }
                        else{
                            data.status = 4;
                            data.isApprovedTwo = true;
                            delete data.createdBy;
                            delete data._id;
                            busiTripModel.findByIdAndUpdate(id, data, {new: true}, function(err){
                                if(err){
                                    return next(err);
                                }
                                res.status(200).send({success: 'updated'});
                            });
                        }
                    }

                }

                else if(isafter){
                    if(data.status == 3){
                        console.log('data',isApproved);
                        if(!isApproved){
                            console.log(1111);
                            data.isApproved = true;
                            data.status = -2;
                            delete data.createdBy;
                            delete data._id;

                            busiTripModel.findByIdAndUpdate(id, data, {new: true}, function (err) {
                                if (err) {
                                    return next(err);
                                }

                                res.status(200).send({success: 'updated'});
                            });
                        }
                        else{
                            console.log(2222);
                            data.isApprovedTwo = true;
                            data.status = 4;
                            delete data.createdBy;
                            delete data._id;

                            busiTripModel.findByIdAndUpdate(id, data, {new: true}, function (err) {
                                if (err) {
                                    return next(err);
                                }

                                res.status(200).send({success: 'updated'});
                            });
                        }
                        
         
                    }
                    else if(data.status < 3){
                        console.log(2);
                        data.status ++;
                        user.aggregate([
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
                        ],function(err,result){
                            if(err){
                                return next(err);
                            }
                            console.log(result);
                            var empId = result[0].relatedEmployee;
                            employee.aggregate([
                                {
                                    $match:{
                                        _id: objectId(empId)
                                    }
                                },
                                {
                                    $project:{
                                        manager: 1
                                    }
                                }
                            ],function(err, manId){
                                if(err){
                                    return next(err);
                                }
                                data.manager = manId[0].manager;
                                delete data.createdBy;
                                delete data._id;

                                busiTripModel.findByIdAndUpdate(id, data, {new: true}, function (err) {
                                    if (err) {
                                        return next(err);
                                    }

                                    res.status(200).send({success: 'updated'});
                                });
                            });
                        });
                    }
                }
                else{
                    if(data.status == 2){
                        console.log('isApproved',data.isApproved);
                        if(!isApproved){
                            console.log(1122);
                            data.isApproved = true;
                            data.status = -2;
                            delete data.createdBy;
                            delete data._id;

                            busiTripModel.findByIdAndUpdate(id, data, {new: true}, function (err) {
                                if (err) {
                                    return next(err);
                                }

                                res.status(200).send({success: 'updated'});
                            });
                        }
                        else{
                            console.log(2233);
                            data.isApprovedTwo = true;
                            data.status = 4;
                            delete data.createdBy;
                            delete data._id;

                            busiTripModel.findByIdAndUpdate(id, data, {new: true}, function (err) {
                                if (err) {
                                    return next(err);
                                }

                                res.status(200).send({success: 'updated'});
                            });
                        }
                        
         
                    }
                    else if(data.status < 2){
                        console.log(2244);
                        data.status ++;
                        user.aggregate([
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
                        ],function(err,result){
                            if(err){
                                return next(err);
                            }
                            console.log(result);
                            var empId = result[0].relatedEmployee;
                            employee.aggregate([
                                {
                                    $match:{
                                        _id: objectId(empId)
                                    }
                                },
                                {
                                    $project:{
                                        manager: 1
                                    }
                                }
                            ],function(err, manId){
                                if(err){
                                    return next(err);
                                }
                                data.manager = manId[0].manager;
                                delete data.createdBy;
                                delete data._id;

                                busiTripModel.findByIdAndUpdate(id, data, {new: true}, function (err) {
                                    if (err) {
                                        return next(err);
                                    }

                                    res.status(200).send({success: 'updated'});
                                });
                            });
                        });
                    }
                }
            });

            
        }

        
        else{
            console.log(3);
            data.status = -1;  
            delete data.createdBy;
            delete data._id;

            busiTripModel.findByIdAndUpdate(id, data, {new: true}, function (err) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({success: 'updated'});
            });
        }


        

    };

    this.getByView = function (req, res, next) {
        var busiTripSchema = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var user = models.get(req.session.lastDb, 'Users', userSchema);
        var employee = models.get(req.session.lastDb, 'Employees', empolyeeSchema);
        var id = req.params._id;
        var uId = req.session.uId;
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var parallelTasks;

        var getTotal = function (pCb) {

            busiTripSchema.count(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        var getData = function (pCb) {
            // busiTripSchema.find().skip(skip).limit(limit).sort(sort).exec(function (err, _res) {
            var sort;
            if (data.sort) {
                keys = Object.keys(data.sort)[0];
                data.sort[keys] = parseInt(data.sort[keys], 10);
                sort = data.sort;
            } else {
                sort = {'editedBy.date': -1};
            }

            user.aggregate([
                    {
                        $match:{
                            _id: objectId(uId)
                        }
                    },{
                        $project:{
                            relatedEmployee: 1
                        }
                    }
                ],function(err,emp){
                    if(err){
                        return pCb(err);
                    }
                    var managerId = emp[0].relatedEmployee;
                    busiTripSchema.aggregate([
                         {
                                $lookup: {
                                    from        : 'Employees',
                                    localField  : 'name',
                                    foreignField: '_id',
                                    as          : 'name'
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
                                $lookup: {
                                    from        : 'Users',
                                    localField  : 'editedBy.user',
                                    foreignField: '_id',
                                    as          : 'editedBy.user'
                                  }
                        },{
                            $match:{
                                manager: managerId,
                                $and:[{
                                    status : 
                                    {
                                        $ne: -2
                                    } 
                                },{
                                    status : 
                                    {
                                        $ne: 4
                                    } 
                                },{
                                    status:
                                    {
                                        $ne: -1
                                    }
                                }]
                                
                            }
                        },
                        {
                                $lookup: {
                                    from        : 'Employees',
                                    localField  : 'manager',
                                    foreignField: '_id',
                                    as          : 'manager'
                                }
                        },
                        {
                                $project: {
                                    _id             : 1,
                                    ID              : 1,
                                    name            : {$arrayElemAt: ['$name', 0]},
                                    date            : 1,
                                    description     : 1,
                                    air             : 1,
                                    train           : 1,
                                    bus             : 1,
                                    taxi            : 1,
                                    selfdrive       : 1,
                                    status          : 1,
                                    amount          : 1,
                                    registrationDate: 1,
                                    accommodationDay: 1,
                                    diningNumber    : 1,
                                    isafter         : 1,
                                    isApproved      : 1,
                                    isApprovedTwo   : 1,
                                    isPaid          : 1,
                                    manager         : {$arrayElemAt: ['$manager', 0]},
                                    'createdBy.user': {$arrayElemAt: ['$createdBy.user', 0]},
                                    'editedBy.user' : {$arrayElemAt: ['$editedBy.user', 0]},
                                    'createdBy.date': 1,
                                    'editedBy.date' : 1,
                                    workflow        : 1
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
                                    ID              : '$root.ID',
                                    'name._id'      : '$root.name._id',
                                    'name.first'    : '$root.name.name.first',
                                    'name.last'     : '$root.name.name.last',
                                    date            : '$root.date',
                                    description     : '$root.description',
                                    air             : '$root.air',
                                    train           : '$root.train',
                                    bus             : '$root.bus',
                                    taxi            : '$root.taxi',
                                    selfdrive       : '$root.selfdrive',
                                    status          : '$root.status',
                                    registrationDate: '$root.registrationDate',
                                    accommodationDay: '$root.accommodationDay',
                                    diningNumber    : '$root.diningNumber',
                                    amount          : '$root.amount',
                                    isafter         : '$root.isafter',
                                    isApproved      : '$root.isApproved',
                                    isApprovedTwo   : '$root.isApprovedTwo',
                                    isPaid          : '$root.isPaid',
                                    manager         : '$root.manager',
                                    'editedBy.user' : '$root.editedBy.user.login',
                                    'createdBy.user': '$root.createdBy.user.login',
                                    'editedBy.date' : '$root.editedBy.date',
                                    'createdBy.date': '$root.createdBy.date',
                                    workflow        : '$root.workflow'
                                }
                        },
                        {
                            $sort: sort
                        }
                        ],function (err, _res) {
                        if (err) {
                            return pCb(err);
                        }

                        pCb(null, _res);
                    });
                });
            


            
        };

        parallelTasks = [getTotal, getData];

        async.parallel(parallelTasks, function (err, result) {
            var count;
            var response = {};

            if (err) {
                return next(err);
            }

            count = result[0] || 0;

            response.total = count;
            response.data = result[1];
            res.status(200).send(response);
        });

    };

};

module.exports = BusiTrip;
