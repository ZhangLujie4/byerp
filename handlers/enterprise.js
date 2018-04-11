var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var enterpriseSchema = mongoose.Schemas.enterprise;
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
        var enterprise = models.get(req.session.lastDb, 'enterprise', enterpriseSchema);
        var body = req.body;
        var newEnterprise;

        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };

        newEnterprise = new enterprise(body);

        newEnterprise.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
        });
    };

    this.getEnterprise = function (req, res, next) {
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
        var enterprise = models.get(req.session.lastDb, 'enterprise', enterpriseSchema);
        enterprise.findById(data.id)
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
        var enterprise = models.get(req.session.lastDb, 'enterprise', enterpriseSchema);
        sort = {'sequence': 1};
        enterprise
            .aggregate([
                {
                    $match: {

                        state          : 'normal'
                    }
                },
                {
                    $project: {
                        _id                  : 1,
                        fullName             : 1,
                        shortName            : 1,
                        taxFileNumber        : 1,
                        spell                : 1,
                        region               : 1,
                        linkman              : 1,
                        phone                : 1,
                        bank                 : 1,
                        account              : 1
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
                        _id                    :'$root._id',
                        fullName               :'$root.fullName',
                        shortName              :'$root.shortName',
                        taxFileNumber          :'$root.taxFileNumber',
                        spell                  :'$root.spell',
                        region                 :'$root.region',
                        linkman                :'$root.linkman',
                        phone                  :'$root.phone',
                        bank                   :'$root.bank',
                        account                :'$root.account',
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

        var enterprise = models.get(req.session.lastDb, 'enterprise', enterpriseSchema);

        var newEnterprise;
        enterprise.findById(_id)
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
                newEnterprise = new enterprise(tax);
                newEnterprise.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                });
            });

        delete data._id;
        delete data.createdBy;
        delete data.fileName;

        models.get(req.session.lastDb, 'enterprise', enterpriseSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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

    this.remove = function (req, res, next) {
        var _id = req.params._id;
        var data={};
        data.editedBy = {
            date: new Date(),
            user: req.session.uId
        };
        data.state='delete';

        models.get(req.session.lastDb, 'enterprise', enterpriseSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

            res.send(200, {success: 'Tasks updated', notes: result.notes, sequence: result.sequence});
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