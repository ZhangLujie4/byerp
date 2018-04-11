var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;

var BusiTrip = function (models) {
    'use strict';

    var busiTripSchema = mongoose.Schemas.busiTrip;
    var empolyeeSchema = mongoose.Schemas.Employees;
    var sequenceSchema = mongoose.Schemas.sequence;
    var missionAllowanceSchema = mongoose.Schemas.missionAllowance;
    var userSchema = mongoose.Schemas.User;
    var mapObject = require('../helpers/bodyMaper');
    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');

    this.create = function (req, res, next) {
        var busiTripModel = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var body = req.body;
        body.uId = req.session.uId;
        body.createdBy.user = body.uId;
        body.editedBy.user = body.uId;
        // body.ID = getNextSequence(req, "busiTripID", next);
        var busiTrip = new busiTripModel(body);
        console.log(body);
        busiTrip.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });

    };

    // function getNextSequence(req, name, next){
    //     var sequence = models.get(req.session.lastDb, 'sequence', sequenceSchema);
    //     sequence.findByIdAndUpdate(
    //        {_id: name},
    //        { $inc: { sequence_value: 1 } }, 
    //        {new: true},
    //        function(err){
    //          if(err){
    //             return next(err);
    //          }
    //        }
    //     ); 
    //     return sequence_value;
    // }

    this.patch = function (req, res, next) {
        var busiTripModel = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var user = models.get(req.session.lastDb, 'Users', userSchema);
        var employee = models.get(req.session.lastDb, 'Employees', empolyeeSchema);
        var missionAllowance = models.get(req.session.lastDb, 'missionAllowance', missionAllowanceSchema);
        var id = req.params._id;
        var uId = req.session.uId
        var data = mapObject(req.body);
        
        
        user.aggregate([
            {   
                $match:{
                    _id: objectId(uId)
                }
            },
            {
                $project:{
                    relatedEmployee: 1
                }
            }
        ],function(err, result){
            if(err){
                next(err);
            }

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
                },{
                    $lookup:{
                        from         : 'Employees',
                        localField   : 'manager',
                        foreignField : '_id',
                        as           : 'manager'
                    }
                },{
                    $project:{
                        manager: {$arrayElemAt: ['$manager',0]}
                    }
                },{
                    $project:{
                        'manager._id'    : '$manager._id',
                        'manager.jobType': '$manager.jobType'
                    }
                }
            ],function(err,managerId){
                if(err){
                    next(err);
                }
                missionAllowance.aggregate([
                    {
                        $match:{
                            name: objectId(empId)
                        }
                    },{
                        $project:{
                            allowanceStandard: 1
                        }
                    }
                ],function(err,missionResult){
                    if(err){
                        next(err);
                    }
                    if(managerId[0].manager.jobType == '组长'){
                        data.status = 0;
                      }
                    else if(managerId[0].manager.jobType == '部门经理'){
                        data.status = 1;
                      }
                    else if(managerId[0].manager.jobType == '副总经理'){
                        data.status = 2;
                      }
                    else if(managerId[0].manager.jobType == '总经理'){
                        data.status = 3;
                      }
                    var allowanceStandard;
                    console.log(missionResult);
                    if(missionResult.length == 0){
                        allowanceStandard = 1;
                    }
                    else{
                        allowanceStandard = missionResult[0].allowanceStandard;
                    }
                    data.selfdrive.selfdriveAmount = Number(data.selfdrive.kilometer * allowanceStandard) + Number(data.selfdrive.roadtoll) + Number(data.selfdrive.parkingfee);
                    
                    data.manager = managerId[0].manager._id;
                    data.editedBy.user = req.session.uId;
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
        });
        

        

    };

    this.putchBulk = function (req, res, next) {
        var body = req.body;
        var uId = req.session.uId;
        var dbName = req.session.lastDb;
        var busiTripModel = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var data = {};
        for(var i=0;i<body.ids.length;i++){
            var id = body.ids[i];
            data.isdelete = true;
            busiTripModel.findByIdAndUpdate(id, {$set: data}, {new: true}, function (err, result) {
                if (err) {
                    return next(err);
                }

                });
                
            }
        res.status(200).send({success: 'updated'});

    };



    this.getByView = function (req, res, next) {
        var busiTripSchema = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var user = models.get(req.session.lastDb, 'Users', userSchema);
        var employee = models.get(req.session.lastDb, 'Employees', empolyeeSchema);
        var data = req.query;
        var uId = req.session.uId
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
                },
                {
                    $project:{
                        relatedEmployee: 1
                    }
                }
            ],function(err,result){
                if(err){
                    next(err);
                }
                var empId = result[0].relatedEmployee;
                busiTripSchema.aggregate([
                        {
                                $match:{
                                    name: empId,
                                    isApproved: true,
                                    isdelete: false
                                }
                        },
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
                                    from        : 'Employees',
                                    localField  : 'manager',
                                    foreignField: '_id',
                                    as          : 'manager'
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

    this.remove = function (req, res, next) {
        var id = req.params._id;
        var busiTripSchema = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);

        busiTripSchema.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.bulkRemove = function (req, res, next) {
        var busiTripSchema = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        busiTripSchema.remove({_id: {$in: ids}}, function (err, removed) {
            if (err) {
                return next(err);
            }

            res.status(200).send(removed);
        });
    };

};

module.exports = BusiTrip;
