var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

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

    this.create = function (req, res, next) {
        var busiTripModel = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var sequence = models.get(req.session.lastDb, 'sequence', sequenceSchema);
        var user = models.get(req.session.lastDb, 'Users', userSchema);
        var employee = models.get(req.session.lastDb, 'Employees', empolyeeSchema);
        var body = req.body;
        body.uId = req.session.uId;
        body.createdBy.user = body.uId;
        body.editedBy.user = body.uId;
        body.isApproved = false;
        body.isPaid = false;
        body.isafter = false;
        body.status = 0;
        console.log(moment(body.date.from).isBefore(moment(),'date'));
        if(moment(body.date.from).isBefore(moment(),'date')){
            body.isafter = true;
        }

        function getUser(pcb){
            user.aggregate([
                {
                    $match:{
                        _id : objectId(body.uId)
                    }
                },{
                    $project:{
                        relatedEmployee: 1
                    }
                }

            ],function(err,user){
                if(err){
                    pcb(err);
                }
 
                pcb(null,user);
            });
        }


        function getManager(user, pcb){
            employee.aggregate([
                {
                    $match:{
                        _id: objectId(user[0].relatedEmployee)
                    }
                },{
                    $project:{
                        manager: 1
                    }
                },{
                    $lookup:{
                        from        : 'Employees',
                        localField  : 'manager',
                        foreignField: '_id',
                        as          : 'manager'
                    }
                },{
                    $project: {
                        manager: {$arrayElemAt: ['$manager',0]}
                    }
                },{
                    $project: {
                        'manager._id'     : '$manager._id',
                        'manager.jobType' : '$manager.jobType'
                    }
                }
            ],function(err,manager){
                if(err){
                    pcb(err);
                }
                console.log(manager);
                pcb(null,manager);
            });
        }

        async.waterfall([getUser,getManager],function(err,result){
            if(err){
                next(err);
            }
            sequence.findByIdAndUpdate(
               { _id: objectId("5912d210da402f0fb556e399")},
               { $inc: { sequencevalue: 1 } }, 
               {new: true},
               function(err,sequence){
                 if(err){
                    return next(err);
                 }
                  if(result[0].manager.jobType == '组长'){
                    body.status = 0;
                  }
                  else if(result[0].manager.jobType == '部门经理'){
                    body.status = 1;
                  }
                  else if(result[0].manager.jobType == '副总经理'){
                    body.status = 2;
                  }
                  else if(result[0].manager.jobType == '总经理'){
                    body.status = 3;
                  }
                  body.manager = result[0].manager._id;
                  body.ID = sequence.sequencevalue;
                  var busiTrip = new busiTripModel(body);
                  busiTrip.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send({success: result});
                  });
               }
            ); 

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

    this.patch = function (req, res, next) {
        var busiTripModel = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var id = req.params._id;
        var data = mapObject(req.body);
        data.editedBy.user = req.session.uId;

        delete data.createdBy;
        delete data._id;


        busiTripModel.findByIdAndUpdate(id, data, {new: true}, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'updated'});
        });

    };

    this.getByView = function (req, res, next) {
        var busiTripSchema = models.get(req.session.lastDb, 'busiTrip', busiTripSchema);
        var user = models.get(req.session.lastDb, 'Users', userSchema);
        var data = req.query;
        var uId = req.session.uId;
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
                            $match: {
                                name: objectId(empId),
                                isApproved: false,
                                isdelete:  false
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
                                isApproved      : 1,
                                isafter         : 1,
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
                                isApproved      : '$root.isApproved',
                                isafter         : '$root.isafter',
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

    this.getEmployeeById = function(req, res, next){
         var user = models.get(req.session.lastDb, 'Users', userSchema);
         var uId = req.session.uId;
         console.log(uId);
         user.aggregate([
            {
                $match:{
                    _id: objectId(uId)
                }
            },
            {
                $lookup:{
                    from: 'Employees',
                    localField: 'relatedEmployee',
                    foreignField: '_id',
                    as: 'relatedEmployee'
                }
            },
            {
                $project:{
                    relatedEmployee: {$arrayElemAt: ['$relatedEmployee', 0]}
                }
            },{
                $project:{
                    relatedEmployee: 1
                }
            }
        ],function(err,result){
            if(err){
                next(err);
            }
            var emp = {};
            emp._id = result[0].relatedEmployee._id;
            emp.name = result[0].relatedEmployee.name;
            console.log(emp._id);
            console.log(emp.name);
            res.status(200).send({data: emp});

        });
    };

};

module.exports = BusiTrip;
