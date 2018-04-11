var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

var Certificate = function (models) {
    'use strict';

    var CertificateSchema = mongoose.Schemas.Certificate;
    var fileManagementSchema = mongoose.Schemas.fileManagement;

    var async = require('async');
    var path = require('path');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();

    this.create = function (req, res, next) {
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var body = req.body;
        var uId = req.session.uId;
        var date = moment();
        body.createdBy = {
            user: uId,
            date: date
        };
        body.status = '0';
        body.dataStatus = 'new';
        var certificate = new CertificateModel(body);

        certificate.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });

    };

    this.borrow = function(req, res, next) {
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var fileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var data = req.body;
        var cId = data.certificate;
        var uId = req.session.uId;
        var date = moment();
        var createdBy = {
            user: uId,
            date: date
        };
        CertificateModel.findByIdAndUpdate(cId, {status: '1'}, function(err, result){
            if(err){
                return next(err);
            }            
            data.status = '0';
            data.createdBy = createdBy;

            var fileManagement = new fileManagementModel(data);
            fileManagement.save(function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send({success: result});
            });
            
        });
    };

    this.borrowAll = function(req, res, next){
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var fileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var uId = req.session.id;
        var body = req.body;
        var createdBy = {
                user: uId,
                date: moment()
            };
        async.each(body, function(data, cb){
            var cId = data.certificate;
            
            CertificateModel.findByIdAndUpdate(cId, {status: '1'}, {new: true}, function(err, result){
                if(err){
                    return cb(err);
                }
                data.status = '0';
                data.createdBy = createdBy;
                var fileManagement = new fileManagementModel(data);
                fileManagement.save(function(err, result2){
                    if(err){
                        return cb(err);
                    }
                    cb(null, result2);
                });
            });
        },function(err){
            if(err){
                return next(err);
            }
            res.status(200).send({success: 'success'});
        });
    };

    this.patchBulk = function (req, res, next) {
        var bonusTypeModel = models.get(req.session.lastDb, 'bonusType', bonusTypeSchema);
        var body = req.body;

        async.each(body, function (data, cb) {
            var id = data._id;

            delete data._id;
            bonusTypeModel.findByIdAndUpdate(id, {$set: data}, {new: true}, cb);
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'updated'});
        });
    };

    this.update = function(req, res, next){
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var data = req.body;
        var id = req.params.id;
        var uId = req.session.uId;
        var date = moment();

        CertificateModel.findByIdAndUpdate(id, {dataStatus: 'edited'}, {new: true}, function(err, result){
            if(err){
                return next(err);
            }
            data.attachments = result.attachments;
            data.dataStatus = 'new';
            data.status = result.status;
            data.createdBy = {
                user: result.createdBy.user,
                date: result.createdBy.date
            };
            data.editedBy = {
                user: uId,
                date: date
            };
            console.log(data);
            var Certificate = new CertificateModel(data);
            Certificate.save(function(err, result2){
                if(err){
                    return next(err);
                }
                res.status(200).send(result2);
            });
            
        });
    };

    this.getForView = function (req, res, next) {
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType;
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

            CertificateModel.count(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        var getData = function (pCb) {

            var queryObject = {};
            queryObject.$and = [];
            if (optionsObject) {
                queryObject.$and.push(optionsObject);
            }

            CertificateModel.aggregate([
                {
                    $match: queryObject
                },
                {
                    $project:{
                        name             : 1,
                        certNo           : 1,
                        genre            : 1,
                        holder           : 1,
                        issuer           : 1,
                        status           : 1,
                        remark           : 1,
                        receiptDate      : 1,
                        startDate        : 1,
                        filedDate        : 1,
                        validDate        : 1,
                        imageSrc         : 1,
                        level            : 1,
                        attachments      : 1
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

    this.getReturnInfo = function(req, res, next){
        var FileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var data = req.body;
        var id = req.query.id;

        FileManagementModel.aggregate([
            {
                $match:{
                    certificate: objectId(id),
                }
            },
            {
                $lookup:{
                    from        : 'Department',
                    localField  : 'borrowDepartment',
                    foreignField: '_id',
                    as          : 'borrowDepartment'
                }
            },
            {
                $lookup: {
                    from        : 'Certificate',
                    localField  : 'certificate',
                    foreignField: '_id',
                    as          : 'certificate'
                }
            },
            {
                $project: {
                    borrowDate    : 1,
                    expectedDate  : 1,
                    reason        : 1,
                    borrower      : 1,
                    borrowDepartment : {$arrayElemAt: ['$borrowDepartment', 0]},
                    certificate   : {$arrayElemAt: ['$certificate', 0]}
                }
            },
            {
                $project: {
                    borrowDate    : 1,
                    expectedDate  : 1,
                    reason        : 1,
                    borrower      : 1,
                    'borrowDepartment.name': '$borrowDepartment.name',
                    'borrowDepartment._id' :  '$borrowDepartment._id',
                    'certificate._id'      : '$certificate._id',
                    'certificate.name': '$certificate.name',
                    'certificate.certNo': '$certificate.certNo',
                    'certificate.genre'    : '$certificate.genre'
                }
            },
            {
                $project:{
                    borrowDate   : 1,
                    expectedDate : 1,
                    reason       : 1,
                    borrower     : 1,
                    'borrowDepartment.name' : 1,
                    'borrowDepartment._id'  : 1,
                    'certificate._id'       : 1,
                    'certificate.name' : 1,
                    'certificate.certNo': 1,
                    'certificate.genre'     : 1
                }
            },
            {
                $sort: {
                    borrowDate : -1
                }
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result[0]);
        });
    };

    this.getOneHistory = function(req, res, next){
        var FileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var cId = req.params.id;

        FileManagementModel.aggregate([
            {
                $match: {
                    certificate: objectId(cId),
                    status : '1'
                }
            },
            {
                $project: {
                    borrower: 1,
                    borrowDate: 1,
                    returnDate: 1,
                    borrowDepartment: 1,
                    expectedDate : 1
                }
            },
            {
                $lookup: {
                    from: 'Department',
                    localField: 'borrowDepartment',
                    foreignField: '_id',
                    as : 'borrowDepartment'
                }
            },
            {
                $project: {
                    borrower    : 1,
                    borrowDate  : 1,
                    returnDate  : 1,
                    borrowDepartment: {$arrayElemAt: ['$borrowDepartment', 0]},
                    expectedDate: 1
                }
            },
            {
                $project: {
                    borrower    : 1,
                    borrowDate  : 1,
                    returnDate  : 1,
                    'borrowDepartment._id' : 1,
                    'borrowDepartment.name': 1,
                    expectedDate: 1
                }
            }
        ],function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.returnCertificate = function(req, res, next){
        var FileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var id = req.params.id;
        var data = req.body;
        var cId = data.cId;
        delete data.cId;
        var borrowDate = moment(data.borrowDate);
        var returnDate = moment(data.returnDate);

        data.days = returnDate.diff(borrowDate, 'days');
        console.log(data);
        console.log(id);
        CertificateModel.findByIdAndUpdate(cId, {status: '0'}, function(err, result){
            if(err){
                return next(err);
            }
            FileManagementModel.findByIdAndUpdate(id, data, function(err,result2){
                if(err){
                    return next(err);
                }
                res.status(200).send(result2);
            });
        });

    };

    this.remove = function (req, res, next) {
        var id = req.params._id;
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var fileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var uId = req.session.uId;
        var date = moment();
        var data = {
            dataStatus: 'deleted',
            editedBy: {
                user: uId,
                date: date
            }
        }
        CertificateModel.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            fileManagementModel.update({certificate: id}, data, function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send({success: result});
            });
        });
    };

    this.bulkRemove = function (req, res, next) {
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var fileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var uId = req.session.uId;
        var date = moment();
        var data = {
            idataStatus: 'deleted',
            editedBy: {
                user: uId,
                date: date
            }
        };
        async.each(ids, function(id, cb){
            CertificateModel.findByIdAndUpdate(id, data, function(err, result){
                if(err){
                    return cb(err);
                }
                fileManagementModel.update({certificate: id}, data, {multi: true}, function(err, fileResult){
                    if(err){
                        return cb(err);
                    }
                    cb(null, fileResult);
                });
                
            });
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send('success');
        });
    };


    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var headers = req.headers;

        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'Certificate';

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

                res.status(200).send({success: 'Certificate updated success', data: response});
            });
        });
    };

};

module.exports = Certificate;
