var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var cashDepositSchema = mongoose.Schemas.cashDeposit;
var projectSchema = mongoose.Schemas.Project;
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');
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
    var HistoryService = require('../services/history.js')(models);

    this.create = function (req, res, next) {
        var cashDeposit = models.get(req.session.lastDb, 'cashDeposit', cashDepositSchema);
        var project=models.get(req.session.lastDb, 'Project', projectSchema);
        var body = req.body;
        var newCashDeposit;
        var projectId;
        projectId=body.project;

        project
            .aggregate([
                {
                    $match: {
                        _id          : objectId(projectId)
                    }
                },
                {
                    $project: {

                        pmr                    : 1
                    }
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }
                body.createdBy = {
                    date: new Date(),
                    user: req.session.uId
                };
                body.pmr=result[0].pmr;


                newCashDeposit = new cashDeposit(body);

                newCashDeposit.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
                });
            });

    };

    this.getDeposit = function (req, res, next) {
        var viewType = req.query.viewType;
         if( viewType=='form') {
            getById(req, res, next);
        } else{
            getForList(req, res, next);
        }

    };

    function getById(req, res, next) {
        var data = req.query;
        var deposit = models.get(req.session.lastDb, 'cashDeposit', cashDepositSchema);
        deposit.findById(data.id)
            .populate('project', '_id name')
            .populate('department', '_id name ')
            .populate('pmr', '_id name ')
            .populate('createdBy.user', '_id login ')
            .populate('enterprise', '_id fullName ')
            .exec(function (err, task) {
                if (err) {
                    next(err);
                }

                res.status(200).send(task);
            });

    }

    function getForList (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var filter=data.filter ||{};
        var type=filter.type?{type:filter.type}:{};
        var cashDeposit = models.get(req.session.lastDb, 'cashDeposit', cashDepositSchema);
        sort = {'applyDate': 1};
        cashDeposit
            .aggregate([
                {
                    $match: {

                        state          : 'normal'
                    }
                },
                {
                    $match:type
                },
                {
                    $lookup: {
                        from        : 'Project',
                        localField  : 'project',
                        foreignField: '_id',
                        as          : 'project'
                    }
                },
                {
                    $lookup: {
                        from        : 'Department',
                        localField  : 'department',
                        foreignField: '_id',
                        as          : 'department'
                    }
                },
                {
                    $lookup: {
                        from        : 'enterprise',
                        localField  : 'enterprise',
                        foreignField: '_id',
                        as          : 'enterprise'
                    }
                },
                {
                    $lookup: {
                        from        : 'Users',
                        localField  : 'createdBy.user',
                        foreignField: '_id',
                        as          : 'createdBy.user'
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
                        type               : 1,
                        amount             : 1,
                        applyDate          : 1,
                        flow               : 1,
                        note               : 1,
                        number              :1,
                        project            : {$arrayElemAt: ['$project', 0]},
                        department         : {$arrayElemAt: ['$department', 0]},
                        enterprise         :{$arrayElemAt: ['$enterprise', 0]},
                        pmr                : {$arrayElemAt: ['$pmr', 0]},
                        payDate            : 1,
                        'createdBy.user'   : 1,
                        paymentMethod      : 1,
                        beneficialName     : 1,
                        pmrAmount          : 1,
                        cash               : 1,
                        projectAmount      : 1,
                        unPay              : 1,
                        loanAgreement      : 1
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
                        type               :'$root.type',
                        amount             :'$root.amount',
                        applyDate          :'$root.applyDate',
                        flow               :'$root.flow',
                        note               :'$root.note',
                        project            :'$root.project',
                        number             :'$root.number',
                        department         :'$root.department',
                        enterprise          :'$root.enterprise',
                        pmr                :'$root.pmr',
                        payDate            :'$root.payDate',
                        beneficialName     :'$root.beneficialName',
                        'createdBy.user'   :'$root.createdBy.user',
                        paymentMethod      :'$root.paymentMethod',
                        pmrAmount          :'$root.pmrAmount',
                        cash               :'$root.cash',
                        projectAmount      :'$root.projectAmount',
                        unPay              :'$root.unPay',
                        loanAgreement      :'$root.loanAgreement',
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

    this.Update = function (req, res, next) {
        var _id = req.params._id;
        var data = req.body;
        var fileName = data.fileName;


        data.editedBy = {
            date: new Date(),
            user: req.session.uId
        };

        delete data._id;
        delete data.createdBy;
        delete data.fileName;

        models.get(req.session.lastDb, 'cashDeposit', cashDepositSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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

            var historyOptions = {
                contentType: 'cashDeposit',
                data: data,
                dbName: req.session.lastDb,
                contentId: _id
            };

            HistoryService.addEntry(historyOptions, function(err, result2){
                if(err){
                    return next(err);
                }
                res.send(200,{success: 'update success',result: result2});
            });
        });

    };

    this.remove = function (req, res, next) {
        var _id = req.params._id;
        var data = {};
        var fileName = data.fileName;


        data.editedBy = {
            date: new Date(),
            user: req.session.uId
        };
        data.state='delete';

        delete data._id;
        delete data.createdBy;
        delete data.fileName;

        models.get(req.session.lastDb, 'cashDeposit', cashDepositSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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

    this.getForDd=function (req, res, next) {
        var cashDeposit = models.get(req.session.lastDb, 'cashDeposit', cashDepositSchema);
        cashDeposit
            .aggregate([
                {
                    $match: {

                        state          : 'normal'
                    }
                },
                {
                    $project: {
                        _id                : 1,
                        number              :1
                    }
                },{
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
                        name               :'$root.number'

                    }
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
    }

    this.getInfoById=function (req, res, next) {
        getById(req, res, next);
    };

    this.createReturn=function (req, res, next) {
        var id=req.query.id;
        var data={};
        data.flow='return';
        models.get(req.session.lastDb, 'cashDeposit', cashDepositSchema).findByIdAndUpdate(id, {$set: data}, {new: true}, function (err, result) {

            res.send(200, {success: 'Tasks updated', notes: result.notes, sequence: result.sequence});
        });
    };


}

module.exports = Module;
