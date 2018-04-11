var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var invoiceSchema = mongoose.Schemas.designInvoice;
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
        var invoice = models.get(req.session.lastDb, 'designInvoice', invoiceSchema);
        var body = req.body;
        var newInvoice;

        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };
        newInvoice = new invoice(body);
        newInvoice.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
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
        var invoice = models.get(req.session.lastDb, 'designInvoice', invoiceSchema);
        invoice.findById(data.id)
            .populate('project', '_id name')
            .populate('department', '_id name ')
            .populate('payer', '_id fullName ')
            .populate('realPayer', '_id fullName ')
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
        var invoice = models.get(req.session.lastDb, 'designInvoice', invoiceSchema);
        sort = {'sequence': 1};
        invoice
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
                },{
                    $lookup: {
                        from        : 'Users',
                        localField  : 'createdBy.user',
                        foreignField: '_id',
                        as          : 'createdBy.user'
                    }
                },{
                    $lookup: {
                        from        : 'Department',
                        localField  : 'department',
                        foreignField: '_id',
                        as          : 'department'
                    }
                },{
                    $lookup: {
                        from        : 'enterprise',
                        localField  : 'payer',
                        foreignField: '_id',
                        as          : 'payer'
                    }
                },
                {
                    $lookup: {
                        from        : 'enterprise',
                        localField  : 'realPayer',
                        foreignField: '_id',
                        as          : 'realPayer'
                    }
                },
                {
                    $project: {
                        _id                  : 1,
                        type                   :1,
                        name                  :1,
                        amount                  :1,
                        note                    :1,
                        invoiceDate                 :1,
                        receive                 :1,
                        payer            : {$arrayElemAt: ['$payer', 0]},
                        realPayer            : {$arrayElemAt: ['$realPayer', 0]},
                        project            : {$arrayElemAt: ['$project', 0]},
                        department         : {$arrayElemAt: ['$department', 0]},
                        'createdBy.user'   : 1
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
                        type                   :'$root.type',
                        name                   :'$root.name',
                        amount                 :'$root.amount',
                        note                   :'$root.note',
                        invoiceDate            :'$root.invoiceDate',
                        receive                :'$root.receive',
                        payer                  :'$root.payer',
                        realPayer              :'$root.realPayer',
                        project                :'$root.project',
                        'createdBy.user'       :'$root.createdBy.user',
                        department             :'$root.department',
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
        var data = req.body;

        var _id = req.params._id;
        var fileName = data.fileName;


        data.editedBy = {
            date: new Date(),
            user: req.session.uId
        };

        delete data._id;
        delete data.createdBy;
        delete data.fileName;

        models.get(req.session.lastDb, 'designInvoice', invoiceSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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

        models.get(req.session.lastDb, 'designInvoice', invoiceSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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

}

module.exports = Module;