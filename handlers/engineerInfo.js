var mongoose = require('mongoose');
var Module = function (models) {
    'use strict';

    var engineerInfoSchema = mongoose.Schemas.engineerInfo;
    var engineerManagerSchema = mongoose.Schemas.engineerManager;
    var jobForemanSchema = mongoose.Schemas.jobForeman;
    var checkSituationSchema = mongoose.Schemas.checkSituation;
    var DepartmentSchema = mongoose.Schemas.Department;
    var async = require('async');
    var path = require('path');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();
    var mapObject = require('../helpers/bodyMaper');
    var moment = require('../public/js/libs/moment/moment');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var objectId = mongoose.Types.ObjectId;

    this.getForView = function (req, res, next) {
        var engineerInfoModel = models.get(req.session.lastDb, 'engineerInfo', engineerInfoSchema);
        var options = req.query;
        var queryObject = {status: {$ne: 'edited'}};
        var sort = {};
        var paginationObject = pageHelper(options);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var parallelTasks;
        var getTotal;
        var getData;

        if (options && options.sort) {
            sort = options.sort;
        } else {
            sort = {date: -1};
        }

        getTotal = function (pCb) {
            engineerInfoModel.find(queryObject).count(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        getData = function (pCb) {
            engineerInfoModel.find(queryObject).skip(skip).limit(limit).sort(sort).exec(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
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

    this.getById = function(req, res, next){
        var id = req.params.id;
        var engineerInfoModel = models.get(req.session.lastDb, 'engineerInfo', engineerInfoSchema);

        engineerInfoModel.aggregate([
            {
                $match:{
                    _id: objectId(id),
                }
            },
            {
                $project: {
                    name     : 1,
                    quality  : 1,
                    issArea  : 1,
                    amount   : 1,
                    StartDate: 1,
                    EndDate  : 1,
                    pmr      : 1,
                    pmv      : 1,
                    technicalPerson: 1,
                    cancelDate: 1,
                    fileStatus: 1,
                    materialMember: 1,
                    securityOfficer: 1,
                    qualityInspector: 1,
                    constructionWorker: 1,
                    informationOfficer: 1,
                    address : 1,
                    constructionUnit: 1,
                    supervisionUnit : 1,
                    contractUnit    : 1
                }
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result[0]);
        });
    };

    this.getEngManager = function(req, res, next){
        var eId = req.params.id;
        var engineerManager = models.get(req.session.lastDb, 'engineerManager', engineerManagerSchema);

        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType;
        var uId = req.session.uId;

        var sort;
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var optionsObject = {};
        var keySort;

        var filterMapper = new FilterMapper();
        if (filter && typeof filter === 'object') {
            optionsObject = filterMapper.mapFilter(filter, contentType); // caseFilter(filter);
        }

        var queryObject = {};
        queryObject.$and = [];
        if (optionsObject) {
            queryObject.$and.push(optionsObject);
        }

        if (data.sort) {
            keySort = Object.keys(data.sort)[0];
            data.sort[keySort] = parseInt(data.sort[keySort], 10);
            sort = data.sort;
        } else {
            sort = {'name': 1};
        }
        engineerManager.aggregate([
            {
                $match: {
                    engineerInfo: objectId(eId),
                    status      : {
                        $ne: 'deleted',
                        $ne: 'edited'
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    jobPosition: 1,
                    enterTime: 1,
                    age: 1,
                    jobType: 1,
                    jobQua: 1,
                    certificate: 1,
                    phone: 1,
                    remark: 1
                }
            },
            {
                $group:{
                    _id: null,
                    total: {$sum: 1},
                    root: {$push: '$$ROOT'}
                }
            },
            {
                $unwind: '$root'
            },
            {
                $project:{
                    _id: '$root._id',
                    name: '$root.name',
                    jobPosition: '$root.jobPosition',
                    enterTime: '$root.enterTime',
                    age: '$root.age',
                    jobType: '$root.jobType',
                    jobQua: '$root.jobQua',
                    certificate: '$root.certificate',
                    phone: '$root.phone',
                    remark: '$root.remark',
                    total: 1
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
            var count;
            var firstElement;
            var response = {};
            if(err){
                return next(err);
            }
            firstElement = result[0];
            count = firstElement && firstElement.total ? firstElement.total : 0;
            response.total = count;
            response.data = result;
            res.status(200).send(response);
        })
    };

    this.getEngManagerById = function(req, res, next){
        var id = req.query.id;
        var engineerManager = models.get(req.session.lastDb, 'engineerManager', engineerManagerSchema);
        engineerManager.findById(id,function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.getJobForemanById = function (req, res, next) {
        var id = req.query.id;
        var jobForeman = models.get(req.session.lastDb, 'jobForeman', jobForemanSchema);
        jobForeman.findById(id, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.getJobForeman = function (req, res, next){
        var eId = req.params.id;
        var jobForeman = models.get(req.session.lastDb, 'jobForeman', jobForemanSchema);
        jobForeman.aggregate([
            {
                $match: {
                    engineerInfo: objectId(eId),
                    status      : {
                         $ne: 'deleted',
                         $ne: 'edited'
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    ID  : 1,
                    address: 1,
                    phone : 1,
                    enterTime: 1,
                    estimate: 1,
                    remark : 1,
                    engineerInfo: 1
                }
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.putchModel = function (req, res, next) {
        var id = req.params.id;
        var data = mapObject(req.body);
        var dbName = req.session.lastDb;
        var engineerInfoModel = models.get(dbName, 'engineerInfo', engineerInfoSchema);
        var uId = req.session.uId;
        var date = moment();
        var editedBy = {
            user: uId,
            date: date
        };
        engineerInfoModel.findById(id, function(err, result){
            if(err){
                return next(err);
            }
            var originData = {
                name                : result.name ? result.name: null,
                quality             : result.quality? result.quality: null,
                issArea             : result.issArea? result.issArea: null,
                amount              : result.amount? result.amount: null,
                StartDate           : result.StartDate? result.StartDate: null,
                EndDate             : result.EndDate? result.EndDate: null,
                pmr                 : result.pmr? result.pmr: null,
                pmv                 : result.pmv? result.pmv: null,
                cancelDate          : result.cancelDate? result.cancelDate: null,
                contractUnit        : result.contractUnit? result.contractUnit: null,
                supervisionUnit     : result.supervisionUnit? result.supervisionUnit: null,
                constructionUnit    : result.constructionUnit? result.constructionUnit: null,
                address             : result.address? result.address: null,
                fileStatus          : result.fileStatus? result.fileStatus: null,
                informationOfficer  : result.informationOfficer? result.informationOfficer: null,
                constructionWorker  : result.constructionWorker? result.constructionWorker: null,
                qualityInspector    : result.qualityInspector? result.qualityInspector: null,
                materialMember      : result.materialMember? result.materialMember: null,
                securityOfficer     : result.securityOfficer? result.securityOfficer: null,
                status              : 'edited',
                createdBy           : result.createdBy
            };
            var engineerInfo = new engineerInfoModel(originData);
            engineerInfo.save(function(err, result){
                if(err){
                    return next(err);
                }
                data.editedBy = editedBy;
                engineerInfoModel.findByIdAndUpdate(id, data, {new: true}, function(err, response){
                    if(err){
                        return next(err);
                    }
                    res.status(200).send(response);
                });
            }); 
            
        });
   
    };

    this.putchBulk = function (req, res, next) {
        var body = req.body || {ids: []};;
        var ids = body.ids;
        var uId = req.session.uId;
        var dbName = req.session.lastDb;
        var Holiday = models.get(dbName, 'Holiday', HolidaySchema);
        var engineerInfo = models.get(dbName, 'engineerInfo', engineerInfoSchema);
        async.each(ids, function (id, cb) {
            engineerInfo.findByIdAndUpdate(id, {status: 'deleted'}, {new: true}, function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            });
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'updated'});
        });
    };

    this.remove = function (req, res, next) {
        var id = req.params.id;
        var dbName = req.session.lastDb;
        var uId = req.session.uId;
        var date = moment();
        var engineerInfo = models.get(dbName, 'engineerInfo', engineerInfoSchema);
        var data = {
            isDelete: true,
            editedBy: {
                user: uId,
                date: date
            }
        }
        engineerInfo.findByIdAndUpdate({_id: id}, data, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.bulkRemove = function (req, res, next) {
        var dbName = req.session.lastDb;
        var engineerInfo = models.get(dbName, 'engineerInfo', engineerInfoSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            engineerInfo.findByIdAndRemove(id, function (err, holiday) {
                if (err) {
                    return err(err);
                }

                cb();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: true});
        });
    };

    this.removeEngManager = function(req, res, next){
        var id = req.params.id;
        var dbName = req.session.lastDb;
        var uId = req.session.uId;
        var date = moment();
        var data = {
            status  : 'deleted',
            editedBy: {
                user: uId,
                date: date
            } 
        };
        var engineerManager = models.get(dbName, 'engineerManager', engineerManagerSchema);
        engineerManager.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.removeJobForeman = function(req, res, next){
        var id = req.params.id;
        var uId = req.session.uId;
        var date = moment();
        var data = {
            status  : 'deleted',
            editedBy: {
                user: uId,
                date: date
            }
        };
        var dbName = req.session.lastDb;
        var jobForeman = models.get(dbName, 'jobForeman', jobForemanSchema);
        jobForeman.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.create = function (req, res, next) {
        var dbName = req.session.lastDb;
        var engineerInfoModel = models.get(dbName, 'engineerInfo', engineerInfoSchema);
        var body = req.body;
        var uId = req.session.uId;
        var date = moment();
        body.createdBy = {
            user: uId,
            date: date
        };
        var engineerInfo = new engineerInfoModel(body);

        engineerInfo.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.createEngManager = function(req, res, next){
        var data = mapObject(req.body);
        var engineerManagerModel = models.get(req.session.lastDb, 'engineerManager', engineerManagerSchema);
        var uId = req.session.uId;
        var date = moment();
        data.createdBy = {
            user: uId,
            date: date
        };
        var engineerManager = new engineerManagerModel(data);
        engineerManager.save(function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send({success: result});
        });
    };

    this.createJobForeman = function(req, res, next){
        var data = mapObject(req.body);
        var uId = req.session.uId;
        var date = moment();
        var jobForemanModel = models.get(req.session.lastDb, 'jobForeman', jobForemanSchema);
        data.createdBy = {
            user: uId,
            date: date
        };
        var jobForeman = new jobForemanModel(data);
        jobForeman.save(function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send({success: result});
        });
    };

    this.putchEngManager = function(req, res, next){
        var id = req.params.id;
        var data = mapObject(req.body);
        var engineerManagerModel = models.get(req.session.lastDb, 'engineerManager', engineerManagerSchema);
        var uId = req.session.uId;
        var date = moment();
        engineerManagerModel.findByIdAndUpdate(id, {status: 'edited'}, {new: true}, function(err, result){
            if(err){
                return next(err);
            }
            data.createdBy.user = result.createdBy.user;
            data.createdBy.date = result.createdBy.date;
            data.engineerInfo = result.engineerInfo;
            data.editedBy = {
                user: uId,
                date: date
            };
            var engineerManager = new engineerManagerModel(data);
            engineerManager.save(function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send(result);
            });
        });
    };

    this.putchJobForeman = function(req, res, next){
        var id = req.params.id;
        var data = mapObject(req.body);
        var jobForemanModel = models.get(req.session.lastDb, 'jobForeman', jobForemanSchema);
        var uId = req.session.uId;
        var date = moment();
        var editedBy = {
            user: uId,
            date: date
        };
        jobForemanModel.findByIdAndUpdate(id, {status: 'edited'}, {new: true}, function(err, response){
            if(err){
                return next(err);
            }
            console.log(response);
            data.createdBy = {
                user: response.createdBy.user,
                date: response.createdBy.date
            }
            data.engineerInfo = response.engineerInfo;
            data.editedBy = editedBy;
            var jobForeman = new jobForemanModel(data);
            jobForeman.save(function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send(result);
            });
        });
    };

    this.getCheckSitu = function(req, res, next){
        var id = req.params.id;
        var checkSituation = models.get(req.session.lastDb, 'checkSituation', checkSituationSchema);
        checkSituation.aggregate([
            {
                $match: {
                    engineerInfo: objectId(id),
                    isDelete: false
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
                    approveMan  : {$arrayElemAt: ['$approveMan', 0]},
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
            }
        ], function(err, result){
            if(err){
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.createCheckSitu = function(req, res, next){
        var checkSituationModel = models.get(req.session.lastDb, 'checkSituation', checkSituationSchema);
        var Department = models.get(req.session.lastDb, 'Department', DepartmentSchema);
        var data = mapObject(req.body);
        var uId = req.session.uId;
        var date = moment();
        data.createdBy = {
            user: uId,
            date: date
        };
        data.status = 'new';
        
        Department.aggregate([
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
        ], function(err, depResult){
            if(err){
                return next(err);
            }
            var approveMan = depResult[0].departmentManager;
            data.approveMan = approveMan;
            var checkSituation = new checkSituationModel(data);
            checkSituation.save(function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send({success: result});
            });
        });
        
    };

    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'checkSituation', checkSituationSchema);
        var headers = req.headers;

        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'checkSituation';

        var files = req.files && req.files.attachfile ? req.files.attachfile : null;

        var dir;
        var err;
        console.log(id);
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

                res.status(200).send({success: 'success', data: response});
            });
        });
    };

    this.getCheckSituById = function(req, res, next){
        console.log(req);
        var timeStamp = Number(req.query.id);
        console.log(timeStamp);
        var checkSituationModel = models.get(req.session.lastDb, 'checkSituation', checkSituationSchema);
        checkSituationModel.aggregate([
            {
                $match: {
                    timeStamp: timeStamp
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
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.removeCheckSitu = function(req, res, next){
        var data = req.body;
        var timeStamps = data.timeStamps;
        var uId = req.session.uId;
        var date = moment();
        var data = {
            isDelete: true,
            editedBy:{
                user: uId,
                date: date
            }
        };
        var checkSituation = models.get(req.session.lastDb, 'checkSituation', checkSituationSchema);
        async.each(timeStamps, function(timeStamp, cb){
            var ts = Number(timeStamp);
            checkSituation.find({timeStamp: ts}, function(err, result){
                if(err){
                    return cb(err);
                }
                async.each(result, function(item, pcb){
                    var id = item._id;
                    checkSituation.findByIdAndUpdate(id, data, function(err, r){
                        if(err){
                            return pcb(err);
                        }
                        pcb(null, r);
                    })
                }, function(err){
                    if(err){
                        return cb(err);
                    }
                    cb(null,'ok');
                });
                
            });
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send('success');
        });
       
    };
};

module.exports = Module;
