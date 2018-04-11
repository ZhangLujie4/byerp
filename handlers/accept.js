var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var acceptSchema = mongoose.Schemas.Accept;
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
    var HistoryService = require('../services/history.js')(models);

    this.create = function (req, res, next) {
        var Accept = models.get(req.session.lastDb, 'Accept', acceptSchema);
        var body = req.body;
        var newAccept;

        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };
        body.acceptState="unUsed";

        newAccept = new Accept(body);

        newAccept.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
        });
    };

    function getAcceptForList (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var filter = data.filter || {};
        var type=filter.type?{acceptType:filter.type}:{};
        var contentType = data.contentType||'accept';
        var optionsObject = {};
        var filterMapper = new FilterMapper();
        if (filter && typeof filter === 'object') {
            optionsObject = filterMapper.mapFilter(filter, contentType); // caseFilter(filter);
        }
        var Accept = models.get(req.session.lastDb, 'Accept', acceptSchema);
        sort = {'acceptState': -1,'endDate': -1};
        Accept
            .aggregate([
                {
                    $match:{
                        editNote:'normal'
                    }
                },
                {
                    $match: optionsObject
                },
                {
                  $match:  type
                },
                {
                    $project: {
                        _id                : 1,
                        acceptDate         : 1,
                        amount             : 1,
                        acceptMan          : 1,
                        payDepartment      : 1,
                        Department         : 1,
                        endDate            : 1,
                        acceptNumber       : 1,
                        payBank            : 1,
                        receiveMan         : 1,
                        note               : 1,
                        acceptType         : 1,
                        acceptState        : 1,
                        payDate            : 1
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
                        acceptDate         :'$root.acceptDate',
                        amount             :'$root.amount',
                        acceptMan          :'$root.acceptMan',
                        payDepartment      :'$root.payDepartment',
                        Department         :'$root.Department',
                        endDate            :'$root.endDate',
                        acceptNumber       :'$root.acceptNumber',
                        payBank            :'$root.payBank',
                        receiveMan         :'$root.receiveMan',
                        note               :'$root.note',
                        acceptType         :'$root.acceptType',
                        acceptState        :'$root.acceptState',
                        payDate        :'$root.payDate',
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

    function getAcceptById(req, res, next) {
        var data = req.query;
        var Accept = models.get(req.session.lastDb, 'Accept', acceptSchema);
        Accept.findById(data.id)
            .exec(function (err, task) {
                if (err) {
                    next(err);
                }

                res.status(200).send(task);
            });

    }

    this.getAccept = function (req, res, next) {
        var viewType = req.query.viewType;
        if(viewType=='form') {
            getAcceptById(req, res, next);
        } else{
            getAcceptForList(req, res, next);
        }
    };

    this.removeAccept = function (req, res, next) {
        var _id = req.params._id;
        var Accept = models.get(req.session.lastDb, 'Accept', acceptSchema);
        var data={};
        data.editedBy = {
            date: new Date(),
            user: req.session.uId
        };
        data.editNote='delete';

        models.get(req.session.lastDb, 'Accept', acceptSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }
            res.send(200, {success: 'Success removed'});
        });
    };

    this.acceptUpdate = function (req, res, next) {
        var _id = req.params._id;
        var data = req.body;
        var fileName = data.fileName;

        delete data._id;
        delete data.createdBy;
        delete data.fileName;

        models.get(req.session.lastDb, 'Accept', acceptSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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
                contentType: 'accept',
                data: data,
                dbName: req.session.lastDb,
                contentId: _id
            };

            HistoryService.addEntry(historyOptions, function(err, result2){
                if(err){
                    return next(err);
                }
                res.send(200,{success: 'update success', result: result2});
            });
        });

    };

    this.getForDd=function (req, res, next) {
        var data = req.query;
        var sort;
        var Accept = models.get(req.session.lastDb, 'Accept', acceptSchema);
        sort = {'acceptState': -1,'endDate': -1};

        Accept
            .aggregate([
                {
                    $match: {
                        acceptState:'unUsed',
                        editNote:'normal'
                    }
                },
                {
                    $project: {
                        _id                : 1,
                        amount             : 1,
                        acceptMan          : 1,
                        acceptNumber       : 1
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: {$concat: ['$acceptNumber', '_ ', '$acceptMan']}
                    }
                },
                {
                    $sort: sort
                }
            ], function (err, result) {
                var count;
                var response = {};

                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });

    };

    this.getById=function (req, res, next){
        getAcceptById(req, res, next);
    };

    this.updateById=function (req, res, next) {

        var data = req.query.data;
        var _id = req.query.id;
        models.get(req.session.lastDb, 'Accept', acceptSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {
            res.send(200, {success: 'Tasks updated', notes: result.notes, sequence: result.sequence});
        })
    };



};

module.exports = Module;
