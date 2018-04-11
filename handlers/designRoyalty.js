var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var enterpriseSchema = mongoose.Schemas.enterprise;
var designRoyaltySchema=mongoose.Schemas.designRoyalty;
var designProjectSchema=mongoose.Schemas.DesignProject;
var employeeSchema = mongoose.Schemas.Employee;
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
        var designRoyalty = models.get(req.session.lastDb, 'designRoyalty', designRoyaltySchema);
        var designProject=models.get(req.session.lastDb, 'DesignProject', designProjectSchema);
        var body = req.body;
        var projectId=body.project;
        var newDesignRoyalty;

        designProject
            .aggregate([
                {
                    $match: {

                        _id          : objectId(projectId)
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        amount                      : 1
                    }
                }
            ],function (err,result) {
                body.amount=result[0].amount;
                body.balance=result[0].amount;
                body.createdBy = {
                    date: new Date(),
                    user: req.session.uId
                };

                newDesignRoyalty = new designRoyalty(body);

                newDesignRoyalty.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
                });
            });


    };

    this.getInfo = function (req, res, next) {
        var viewType = req.query.viewType;
        switch (viewType) {
            case 'form':
                getById(req, res, next);
                break;
            case 'list':
                getForList(req, res, next);
                break;
        }

    };

    function getById(req, res, next) {
        var data = req.query;
        var designRoyalty = models.get(req.session.lastDb, 'designRoyalty', designRoyaltySchema);
        var employee = models.get(req.session.lastDb, 'Employee', employeeSchema);
        var id=data.id;

        designRoyalty.aggregate([{
            $match: {
                _id : objectId(id)
            }
        },{
            $lookup: {
                from        : 'DesignProject',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        },{
            $project: {
                project    : {$arrayElemAt: ['$project', 0]},
                amount     : 1,
                balance    : 1,
                receive    : 1,
                persons    : 1,
                royalties   :1
            }
        }])
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                async.map(result, function (item, cb) {
                    async.map(item.persons, function (person, callback) {
                        employee.findById(person.name).exec(function (err, emp) {
                            if (err) {
                                return callback(err);
                            }
                            person.name = emp;
                            callback(null, person);
                        });

                    }, function (err, empRes) {
                        if (err) {
                            return cb(err);
                        }
                        item.persons = empRes;
                        cb(null, item.persons);
                    });

                }, function (err, itemRes) {
                    if (err) {
                        return next(err);
                    }
                    result = result[0];
                    res.status(200).send(result);
                });

            });
    }

    function getForList (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var designRoyalty = models.get(req.session.lastDb, 'designRoyalty', designRoyaltySchema);
        sort = {'sequence': 1};
        designRoyalty
            .aggregate([
                {
                    $match: {

                        state          : 'normal'
                    }
                },
                {
                    $lookup: {
                        from        : 'DesignProject',
                        localField  : 'project',
                        foreignField: '_id',
                        as          : 'project'
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        project                     : {$arrayElemAt: ['$project', 0]},
                        amount                      : 1,
                        receive                     : 1,
                        balance                     : 1,
                        'createdBy.date'              : 1
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
                        _id                          :'$root._id',
                        project                       :'$root.project',
                        amount                      :'$root.amount',
                        receive                  :'$root.receive',
                        balance                  :'$root.balance',
                        'createdBy.date'                 :'$root.createdBy.date',
                        total                  :1
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

        var designRoyalty = models.get(req.session.lastDb, 'designRoyalty', designRoyaltySchema);

        var newDesignRoyalty;
        designRoyalty.findById(_id)
            .exec(function (err, tax) {
                if (err) {
                    next(err);
                }
                tax._id=null;
                tax.state='modify';
                tax.editedBy = {
                    date: new Date(),
                    user: req.session.uId
                };
                newDesignRoyalty = new designRoyalty(tax);
                newDesignRoyalty.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                });
            });

        delete data._id;
        delete data.createdBy;
        delete data.fileName;

        models.get(req.session.lastDb, 'designRoyalty', designRoyaltySchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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
            res.send(200,{success: 'A new Project crate success', result: result, id: result._id});
        });

    };

    this.remove = function (req, res, next) {
        var _id = req.params._id;
        var data={};
        data.editedBy = {
            date: new Date(),
            user: req.session.uId
        };
        data.state='delete';

        models.get(req.session.lastDb, 'enterprise', enterpriseSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

            res.send(200);
        });
    };

    this.getForDd=function (req, res, next) {

        var enterprise = models.get(req.session.lastDb, 'enterprise', enterpriseSchema);
        enterprise
            .aggregate([
                {
                    $match: {

                        state          : 'normal'
                    }
                },
                {
                    $project: {
                        _id                : 1,
                        fullName              :1,
                        spell                  :1
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
                        name               : {$concat: ['$root.fullName','(','$root.spell',')']}

                    }
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
    }



}

module.exports = Module;