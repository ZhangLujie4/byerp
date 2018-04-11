var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

var stampApplication = function (models) {
    'use strict';

    var StampSchema = mongoose.Schemas.stamp;
    var stampApplicationSchema = mongoose.Schemas.stampApplication;
    var userSchema = mongoose.Schemas.User;
    var EmployeeSchema = mongoose.Schemas.Employee;
    var DepartmentSchema = mongoose.Schemas.Department;
    var stampApprovalSchema = mongoose.Schemas.stampApproval;
    var approvalProcessSchema = mongoose.Schemas.approvalProcess;
    var sequenceSchema = mongoose.Schemas.sequence;
    var async = require('async');
    var path = require('path');
    var RESPONSES = require('../constants/responses');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();

    this.create = function (req, res, next) {
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var sequenceModel = models.get(req.session.lastDb, 'sequence', sequenceSchema);
        var body = req.body;
        var uId = req.session.uId;
        body.isSubmit = false;
        sequenceModel.findOneAndUpdate({name: 'stampApplication'}, {$inc: {sequencevalue: 1}}, {new: true}, function(err, sequence){
            if(err){
                return next(err);
            }
            body.ID = sequence.sequencevalue;
            var stampApplication = new stampApplicationModel(body);

            stampApplication.save(function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({success: result});
            });
        })
    };

    this.affirmApprove = function(req, res, next){
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var UserModel = models.get(req.session.lastDb, 'Users', userSchema);
        var EmployeeModel = models.get(req.session.lastDb, 'Employees', EmployeeModel);
        var DepartmentModel = models.get(req.session.lastDb, 'Department', DepartmentSchema);
        var stampApprovalModel = models.get(req.session.lastDb, 'stampApproval', stampApprovalSchema);
        var approvalProcessModel = models.get(req.session.lastDb, 'approvalProcess', approvalProcessSchema);
        var uId = req.session.uId;
        var sId = req.params.id;

        function update(callback){
            var data = {
                isSubmit: true
            }
            stampApplicationModel.findByIdAndUpdate(sId, data, function(err, result){
                if(err){
                    return callback(err);
                }
                callback(null, result);
            });
        }

        function create(callback){
            stampApplicationModel.aggregate([
                {
                    $match: {
                        _id: objectId(sId)
                    }
                },
                {
                    $project: {
                        fileNumber : 1,
                        fileType   : 1,
                        pageNumber : 1,
                        applyDate  : 1,
                        attachments: 1,
                        department : 1,
                        applyMan   : 1,
                        stamp      : 1,
                        projectName: 1
                    }
                },
                {
                    $unwind: '$stamp'
                },
                {
                    $lookup: {
                        from       : 'Stamps',
                        localField : 'stamp.id',
                        foreignField: '_id',
                        as          : 'stamp.id'
                    }
                },
                {
                    $project: {
                        fileNumber : 1,
                        fileType   : 1,
                        pageNumber : 1,
                        applyDate  : 1,
                        attachments: 1,
                        department : 1,
                        applyMan   : 1,
                        'stamp.id' : {$arrayElemAt: ['$stamp.id', 0]},
                        'stamp.name': 1,
                        projectName: 1
                    }
                },
                {
                    $project: {
                        attachments: 1,
                        'stamp.id': 1,
                        'stamp.name': 1,
                        'stamp.process' : '$stamp.id.approvalProcess'
                    }
                }
            ], function(err, sRes){
                if(err){
                    return callback(err);
                }
                console.log('sRes', sRes);
                sRes.forEach(function(sResItem){
                    var p = sResItem.stamp.process;
                    console.log('process', p);
                    approvalProcessModel.findOne({name: p}, function(err, processRes){
                        if(err){
                            return callback(err);
                        }
                        console.log('processRes', processRes);
                        var approvalProcess = processRes.process;
                        async.map(approvalProcess, function(item, cb){
                            console.log(item);
                            if(item.name == 'departmentManager'){
                                console.log('部门经理');
                                console.log(uId);
                                UserModel.aggregate([
                                    {
                                        $match: {
                                            _id: objectId(uId)
                                        }
                                    },
                                    {
                                        $project: {
                                            relatedEmployee: 1
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: 'Employees',
                                            localField: 'relatedEmployee',
                                            foreignField: '_id',
                                            as: 'relatedEmployee'
                                        }
                                    },
                                    {
                                        $project: {
                                            relatedEmployee: {$arrayElemAt: ['$relatedEmployee', 0]}
                                        }
                                    },
                                    {
                                        $project: {
                                            'relatedEmployee._id': '$relatedEmployee._id',
                                            'relatedEmployee.department': '$relatedEmployee.department'
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: 'Department',
                                            localField: 'relatedEmployee.department',
                                            foreignField: '_id',
                                            as: 'department'
                                        }
                                    },
                                    {
                                        $project: {
                                            department: {$arrayElemAt: ['$department', 0]},
                                            'relatedEmployee._id': 1
                                        }
                                    },
                                    {
                                        $project: {
                                            departmentManager: '$department.departmentManager',
                                            'relatedEmployee._id': 1
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: 'Employees',
                                            localField: 'departmentManager',
                                            foreignField: '_id',
                                            as: 'departmentManager'
                                        }
                                    },
                                    {
                                        $project: {
                                            departmentManager: {$arrayElemAt: ['$departmentManager', 0]},
                                            'relatedEmployee._id': 1
                                        }
                                    },
                                    {
                                        $project: {
                                            'departmentManager._id': '$departmentManager._id',
                                            'departmentManager.name': {$concat: ['$departmentManager.name.first', ' ', '$departmentManager.name.last']},
                                            'relatedEmployee._id': 1
                                        }
                                    }
                                ], function(err, departmentManager){
                                    if(err){
                                        return cb(err);
                                    }
                                    console.log('departmentManager', departmentManager);
                                    var relatedEmpId = departmentManager[0].relatedEmployee._id;
                                    item.id = departmentManager[0].departmentManager._id;
                                    item.name = departmentManager[0].departmentManager.name;
                                    console.log('q', item.id);
                                    console.log('a',item);
                                    if(String(relatedEmpId) == String(item.id)){
                                        
                                        item = {};
                                    }
                                    cb(null, item);
                                });
                            }
                            else{
                                UserModel.aggregate([
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
                                ],function(err, empResult){
                                    if(err){
                                        return cb(err);
                                    }
                                    var relatedEmpId = empResult[0].relatedEmployee;
                                    if(String(relatedEmpId) == String(item.id)){
                                        item = {};
                                    }
                                    cb(null, item);
                                });
                                
                            }
                        }, function(err, result2){
                            if(err){
                                console.log(err);
                                return callback(err);
                            }
                            for(var i = 0, flag = true; i<result2.length; flag? i++ : i){
                                if(!result2[i].id){
                                    result2.splice(i,1);
                                    flag = false;
                                }
                                else{
                                    flag = true;
                                }
                            }
                            console.log('result2', result2);
                            sResItem.stamp.process = result2;
                        });
                    });
                });
                setTimeout(function(){
                    
                    sRes.forEach(function(a){
                        a.stampApplication = a._id;
                        delete a._id;
                        a.process = a.stamp.process;
                        a.stamp = a.stamp.id._id;
                        a.status = 0;
                        a.approveMan = a.process[0].id;
                        var commentItem = {
                            date: null,
                            opinion: ''
                        };
                        a.comment = [];
                        for(var i = 0; i < a.process.length; i++){
                            a.comment.push(commentItem);
                        }
                    });

                    async.each(sRes, function(item, cb){

                        var stampApproval = new stampApprovalModel(item);
                        stampApproval.save(function(err, result){
                            if(err){
                                return cb(err);
                            }
                            cb(null, result);
                        });
                    });
                }, 100);

                callback(null, sRes);
            });           
        }

        async.parallel([update, create], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result[1]);
        });  

    };

    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var headers = req.headers;

        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'stampApplication';

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
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var data = req.body;
        var id = req.params.id;
        stampApplicationModel.findByIdAndUpdate(id, data, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.getForView = function (req, res, next) {
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType;
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


        var getTotal = function (pCb) {

            stampApplicationModel.count(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        var getData = function (pCb) {

            stampApplicationModel.aggregate([
                {
                    $match: {
                        isDelete: false
                    }
                },
                {
                    $lookup:{
                        from        : 'Employees',
                        localField  : 'applyMan',
                        foreignField: '_id',
                        as          : 'applyMan' 
                    }
                },
                {
                    $lookup:{
                        from        : 'Department',
                        localField  : 'department',
                        foreignField: '_id',
                        as          : 'department'
                    }
                },
                {
                    $lookup:{
                        from        : 'Opportunities',
                        localField  : 'projectName',
                        foreignField: '_id',
                        as          : 'projectName'
                    }
                },
                {
                    $project:{
                        ID         : 1,
                        projectName: {$arrayElemAt: ['$projectName', 0]},
                        applyDate  : 1,
                        applyMan   : {$arrayElemAt: ['$applyMan', 0]},
                        department : {$arrayElemAt: ['$department', 0]},
                        stamp      : 1,
                        comment    : 1,
                        fileNumber : 1,
                        pageNumber : 1,
                        fileType   : 1,
                        attachments: 1,
                        isSubmit   : 1
                    }
                },
                {
                    $project:{
                        ID                : 1,
                        'projectName._id' : '$projectName._id',
                        'projectName.name': '$projectName.name',
                        applyDate        : 1,
                        'applyMan.name'  : '$applyMan.name',
                        'applyMan._id'   : '$applyMan._id',
                        'department.name': '$department.name',
                        'department._id' : '$department._id',
                        stamp            : 1,
                        comment          : 1,
                        fileNumber       : 1,
                        pageNumber       : 1,
                        fileType         : 1,
                        attachments      : 1,
                        isSubmit         : 1
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
            ],function(err, result){
                if(err){
                    return pCb(err);
                }
                pCb(null, result);
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

    this.getById = function (req, res, next){
        var id = req.params.id;
        var stampApprovalModel = models.get(req.session.lastDb, 'stampApproval', stampApprovalSchema);

        stampApprovalModel.aggregate([
            {
                $match: {
                    stampApplication: objectId(id)
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
                $lookup: {
                    from: 'Employees',
                    localField: 'approveMan',
                    foreignField: '_id',
                    as: 'approveMan'
                }
            },
            {
                $project: {
                    stamp: {$arrayElemAt: ['$stamp', 0]},
                    approveMan: {$arrayElemAt: ['$approveMan', 0]},
                    status: 1,
                    comment: 1,
                    process: 1,
                    // processTotal: 1
                }
            },
            {
                $project: {
                    'stamp._id' : '$stamp._id',
                    'stamp.name': '$stamp.name',
                    'approveMan.name': '$approveMan.name',
                    'approveMan._id' : '$approveMan._id',
                    status      : 1,
                    comment     : 1,
                    process     : 1,
                    // processTotal: 1
                }
            }
        ], function(err, result){
            if(err){
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.remove = function (req, res, next) {
        var id = req.params._id;
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var uId = req.session.uId;
        var date = moment();
        var data = {
            isDelete: true,
            editedBy:{
                user: uId,
                date: date 
            }
        };
        stampApplicationModel.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.bulkRemove = function (req, res, next) {
        var stampApplicationModel = models.get(req.session.lastDb, 'stampApplication', stampApplicationSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var uId = req.session.uId;
        var date = moment();
        var data = {
            isDelete: true,
            editedBy: {
                user: uId,
                date: date
            }
        };
        async.each(ids, function(id, cb){
            stampApplicationModel.findByIdAndUpdate(id, data, function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            })
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send({success: 'success'});
        });
        // stampApplicationModel.remove({_id: {$in: ids}}, function (err, removed) {
        //     if (err) {
        //         return next(err);
        //     }

        //     res.status(200).send(removed);
        // });
    };

};

module.exports = stampApplication;
