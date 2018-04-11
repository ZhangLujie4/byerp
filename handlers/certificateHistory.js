var mongoose = require('mongoose');

var certificateHistory = function (models) {
    'use strict';

    var CertificateSchema = mongoose.Schemas.Certificate;
    var fileManagementSchema = mongoose.Schemas.fileManagement;

    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');

    this.getList = function (req, res, next) {
        var fileManagementModel = models.get(req.session.lastDb, 'fileManagement', fileManagementSchema);
        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType;
        var sort;
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var parallelTasks;
        var keySort;
        var optionsObject = {};

        var filterMapper = new FilterMapper();
        if (filter && typeof filter === 'object') {
            optionsObject = filterMapper.mapFilter(filter, contentType); // caseFilter(filter);
        }

        if (data.sort) {
            keySort = Object.keys(data.sort)[0];
            data.sort[keySort] = parseInt(data.sort[keySort], 10);
            sort = data.sort;
        } else {
            sort = {'borrowDate': -1};
        }

        var getTotal = function (pCb) {

            fileManagementModel.count(function (err, _res) {
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

            fileManagementModel.aggregate([
                {
                    $match: {
                        status : '1',
                        isDelete: false
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
                        returnDate  : 1,
                        borrower    : 1,
                        expectedDate: 1,
                        borrowDepartment: {$arrayElemAt: ['$borrowDepartment',0]},
                        certificate : {$arrayElemAt: ['$certificate', 0]}
                    }
                },
                {
                    $project:{
                        borrowDate  : 1,
                        returnDate  : 1,
                        borrower    : 1,
                        expectedDate: 1,
                        'borrowDepartment.name' :  '$borrowDepartment.name',
                        'borrowDepartment._id'  :  '$borrowDepartment._id',
                        'certificate.certNo'    :  '$certificate.certNo',
                        'certificate.name'  : '$certificate.name'
                    }
                },
                {
                    $project:{
                        borrowDate: 1,
                        returnDate: 1,
                        borrower  : 1,
                        expectedDate: 1,
                        'borrowDepartment.name': '$borrowDepartment.name',
                        'borrowDepartment._id' : '$borrowDepartment._id',
                        'certificate.certNo'   : 1,
                        'certificate.name': 1
                    }
                },
                {
                    $match: queryObject
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
            ],function (err, _res) {
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

};

module.exports = certificateHistory;
