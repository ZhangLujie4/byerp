/**
 * Created by admin on 2017/6/26.
 */
/*TODO remove caseFilter methid after testing filters*/

var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var FECertificateSchema = mongoose.Schemas.FECertificate;
var FECertificateEditSchema = mongoose.Schemas.FECertificateEdit;
var objectId = mongoose.Types.ObjectId;

var _ = require('underscore');
var async = require('async');

var Module = function (models, event) {
    'use strict';

    var validator = require('../helpers/validator');

    var fs = require('fs');
    var path = require('path');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();
    var FilterMapper = require('../helpers/filterMapper');

    this.create = function (req, res, next) {
        var FECertificate = models.get(req.session.lastDb, 'FECertificate', FECertificateSchema);
        var body = req.body;
        var newFECertificate;

        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };

        newFECertificate = new FECertificate(body);

        newFECertificate.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
        });
    };


    this.getFECertificate = function (req, res, next) {
        var viewType = req.query.viewType;

        switch (viewType) {
            case 'form':
                getFECertificateById(req, res, next);
                break;
            case 'list':
                getFECertificateForList(req, res, next);
                break;
        }

    };

    function getFECertificateById(req, res, next) {
        var data = req.query;
        var Accept = models.get(req.session.lastDb, 'FECertificate', FECertificateSchema);
        Accept.findById(data.id)
            .populate('project', '_id name date')
            .populate('pmr', '_id name')
            .exec(function (err, task) {
                if (err) {
                    next(err);
                }
                console.log(task)
                res.status(200).send(task);
            });

    }

    function getFECertificateForList (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var Accept = models.get(req.session.lastDb, 'FECertificate', FECertificateSchema);
        sort = {'makeDate': -1};

        Accept
            .aggregate([
                {
                    $lookup: {
                        from        : 'Project',
                        localField  : 'project',
                        foreignField: '_id',
                        as          : 'project'
                    }
                },{
                    $lookup: {
                        from        : 'Employees',
                        localField  : 'pmr',
                        foreignField: '_id',
                        as          : 'pmr'
                    }
                },
                {
                    $project: {
                        _id                : 1,
                        logoutDate         : 1,
                        amount             : 1,
                        makeDate           : 1,
                        project            : {$arrayElemAt: ['$project', 0]},
                        pmr                :{$arrayElemAt: ['$pmr', 0]},
                        endDate            : 1,
                        number             :1
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
                        _id                :'$root._id',
                        logoutDate         :'$root.logoutDate',
                        amount             :'$root.amount',
                        makeDate           :'$root.makeDate',
                        number             :'$root.number',
                        pmr                :'$root.pmr',
                        endDate            :'$root.endDate',
                        project            : '$root.project',
                        total              :1
                    }
                },
                {
                    $sort: sort
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }
            ], function (err, result) {
                var count;
                var response = {};

                if (err) {
                    return next(err);
                }

                count = result[0] && result[0].total ? result[0].total : 0;

                response.total = count;
                response.data = result;
                res.status(200).send(response);
            });

    }

    this.FECertificateUpdate = function (req, res, next) {
        var _id = req.params._id;
        var data = req.body;
        var fileName = data.fileName;

        var Accept = models.get(req.session.lastDb, 'FECertificate', FECertificateSchema);
        var acceptEdit=models.get(req.session.lastDb, 'FECertificateEdit', FECertificateEditSchema);
        var newAccept;
        Accept.findById(_id)
            .exec(function (err, accept) {
                if (err) {
                    next(err);
                }
                accept._id=null;
                accept.editNote='修改';
                accept.editedBy = {
                    date: new Date(),
                    user: req.session.uId
                };
                newAccept = new acceptEdit(accept);
                newAccept.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                });
            });

        delete data._id;
        delete data.createdBy;
        delete data.fileName;

        models.get(req.session.lastDb, 'FECertificate', FECertificateSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

            var os = require('os');
            var osType = (os.type().split('_')[0]);
            var path;
            var dir;
            var newDirname;

            if (err) {
                return next(err);
            }

            if (fileName) {
                switch (osType) {
                    case 'Windows':
                        newDirname = __dirname.replace('\\Modules', '');
                        while (newDirname.indexOf('\\') !== -1) {
                            newDirname = newDirname.replace('\\', '\/');
                        }
                        path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                        dir = newDirname + '\/uploads\/' + _id;
                        break;
                    case 'Linux':
                        newDirname = __dirname.replace('/Modules', '');
                        while (newDirname.indexOf('\\') !== -1) {
                            newDirname = newDirname.replace('\\', '\/');
                        }
                        path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                        dir = newDirname + '\/uploads\/' + _id;
                }
                fs.unlink(path, function (err) {
                    console.log(err);
                    fs.readdir(dir, function (err, files) {
                        if (files && files.length === 0) {
                            fs.rmdir(dir, function () {
                            });
                        }
                    });
                });
            }
            res.send(200, {success: 'Tasks updated', notes: result.notes, sequence: result.sequence});
        });

    };

    this.removeFECertificate = function (req, res, next) {
        var _id = req.params._id;
        var Accept = models.get(req.session.lastDb, 'FECertificate', FECertificateSchema);
        var acceptEdit=models.get(req.session.lastDb, 'FECertificateEdit', FECertificateEditSchema);
        var newAccept;
        Accept.findById(_id)
            .exec(function (err, accept) {
                if (err) {
                    next(err);
                }
                accept._id=null;
                accept.editNote='删除';
                accept.editedBy = {
                    date: new Date(),
                    user: req.session.uId
                };
                newAccept = new acceptEdit(accept);
                newAccept.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                });
            });

        models.get(req.session.lastDb, 'FECertificate', FECertificateSchema).findByIdAndRemove(_id, function (err, task) {
            if (err) {
                return next(err);
            }
            res.send(200, {success: 'Success removed'});
        });
    };



}

module.exports = Module;
