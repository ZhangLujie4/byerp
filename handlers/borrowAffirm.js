var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

var borrowAffirm = function (models) {
    'use strict';

    var CertificateSchema = mongoose.Schemas.Certificate;
    var fileManagementSchema = mongoose.Schemas.fileManagement;
    var certificateNameSchema = mongoose.Schemas.certificateName;
    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');

    this.getList = function (req, res, next) {
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var fileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var keySort;

        if (data.sort) {
            keySort = Object.keys(data.sort)[0];
            data.sort[keySort] = parseInt(data.sort[keySort], 10);
            sort = data.sort;
        } else {
            sort = {'certificate.name': -1};
        }

        fileManagementModel.aggregate([
            {
                $match: {
                    status:'0'
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
                $lookup:{
                    from        : 'Certificate',
                    localField  : 'certificate',
                    foreignField: '_id',
                    as          : 'certificate'
                }
            },
            {
                $project:{
                    borrowDate  : 1,
                    borrower    : 1,
                    expectedDate: 1,
                    borrowDepartment: {$arrayElemAt: ['$borrowDepartment',0]},
                    certificate : {$arrayElemAt: ['$certificate', 0]}
                }
            },
            {
                $project:{
                    borrowDate  : 1,
                    borrower    : 1,
                    expectedDate: 1,
                    'borrowDepartment.name' :  '$borrowDepartment.name',
                    'borrowDepartment._id'  :  '$borrowDepartment._id',
                    'certificate.certNo'    :  '$certificate.certNo',
                    'certificate.name'             : '$certificate.name',
                    'certificate._id'              : '$certificate._id'
                }
            },
            {
                $project:{
                    borrowDate  : 1,
                    borrower    : 1,
                    expectedDate: 1,
                    'borrowDepartment.name' : 1,
                    'borrowDepartment._id'  : 1,
                    'certificate.certNo'    : 1,
                    'certificate.name'             : 1,
                    'certificate._id'              : 1
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
                $project:{
                    _id             : '$root._id',
                    borrowDate      : '$root.borrowDate',
                    borrower        : '$root.borrower',
                    expectedDate    : '$root.expectedDate',
                    'borrowDepartment.name': '$root.borrowDepartment.name',
                    'borrowDepartment._id' : '$root.borrowDepartment._id',
                    'certificate.name'     : '$root.certificate.name',
                    'certificate.certNo'   : '$root.certificate.certNo',
                    'certificate._id'      : '$root.certificate._id'
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
        ],function(err, result){
            if(err){
                return next(err);
            }
            console.log(result);
            var response = {};
            var firstElement = result[0];
            var count = firstElement && firstElement.total ? firstElement.total : 0;
            response.total = count;
            response.data = result;
            res.status(200).send(response);
        });


    };

    this.affirmBorrow = function(req, res, next){
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var fileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var data = req.body.dataArray;
        var uId = req.session.uId;
        var editedBy = {
            user: uId,
            date: moment()
        };
        async.each(data, function (id, cb) {
            fileManagementModel.findByIdAndUpdate(id, {status: '1', editedBy: editedBy}, {new: true}, function(err, result){
                if(err){
                    return next(err)
                }
                var cId = result.certificate;
                CertificateModel.findByIdAndUpdate(cId, {status: '2'}, {new: true}, cb);
            });
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send({success: 'updated'});
        });
    }

    this.disagreeBorrow = function(req, res, next){
        var CertificateModel = models.get(req.session.lastDb, 'Certificate', CertificateSchema);
        var fileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var data = req.body.dataArray;
        var uId = req.session.uId;
        var editedBy = {
            user: uId,
            date: moment()
        };
        async.each(data, function (id, cb) {
            fileManagementModel.findByIdAndUpdate(id, {status: '-1',editedBy: editedBy}, {new: true}, function(err, result){
                if(err){
                    return next(err)
                }
                var cId = result.certificate;
                CertificateModel.findByIdAndUpdate(cId, {status: '0'}, {new: true}, cb);
            });
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send({success: 'updated'});
        });
    }

};

module.exports = borrowAffirm;
