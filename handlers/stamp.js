var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');

var stamp = function (models) {
    'use strict';

    var userSchema = mongoose.Schemas.User;
    var EmployeeSchema = mongoose.Schemas.Employee;
    var DepartmentSchema = mongoose.Schemas.Department;

    var StampSchema = mongoose.Schemas.stamp;
    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');

    this.create = function (req, res, next) {
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);
        var body = req.body;
        var date = moment();
        var uId = req.session.uId;
        body.createdBy = {
            user: uId,
            date: date
        };
        body.status = 'new';
        var Stamp = new StampModel(body);
        Stamp.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });

    };


    this.patchBulk = function (req, res, next) {
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);
        var body = req.body;

        async.each(body, function (data, cb) {
            var id = data._id;

            delete data._id;
            StampModel.findByIdAndUpdate(id, {$set: data}, {new: true}, cb);
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'updated'});
        });
    };

    this.update = function(req, res, next){
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);
        var data = req.body;
        var id = req.params.id;
        var uId = req.session.uId;
        var date = moment();
        data.editedBy = {
            user: uId,
            date: date
        };
        StampModel.findByIdAndUpdate(id, {status: 'edited'}, function(err, result){
            if(err){
                return next(err);
            }
            data.createdBy = {
                user: result.createdBy.user,
                date: result.createdBy.date
            };
            data.status = 'new';
            var Stamp = new StampModel(data);
            Stamp.save(function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send({success: result});
            });
        });
    };

    this.getForView = function (req, res, next) {
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);
        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType;
        // var sort = data.sort || {};
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
            sort = {'name': 1};
        }


        var getTotal = function (pCb) {

            StampModel.count(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        var getData = function (pCb) {

            StampModel.aggregate([
                {
                    $match: {
                        status: 'new'
                    }
                },
                {
                    $lookup: {
                        from        : 'Employees',
                        localField  : 'keeper',
                        foreignField: '_id',
                        as          : 'keeper'
                    }
                },
                {
                    $lookup: {
                        from        : 'Employees',
                        localField  : 'charger',
                        foreignField: '_id',
                        as          : 'charger' 
                    }
                },
                {
                    $project:{
                        name           : 1,
                        comment        : 1,
                        approvalProcess: 1,
                        type           : 1,
                        stampsCode     : 1,
                        keeper         : {$arrayElemAt: ['$keeper', 0]},
                        charger        : {$arrayElemAt: ['$charger', 0]},
                        startDate      : 1
                    }
                },
                {
                    $project: {
                        name           : 1,
                        comment        : 1,
                        approvalProcess: 1,
                        type           : 1,
                        stampsCode     : 1,
                        startDate      : 1,
                        'keeper._id'   : '$keeper._id',
                        'keeper.name'  : '$keeper.name',
                        'charger._id'  : '$charger._id',
                        'charger.name' : '$charger.name'
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

    this.remove = function (req, res, next) {
        var id = req.params._id;
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);
        var uId = req.session.uId;
        var date = moment();
        var data = {
            status: 'deleted',
            editedBy: {
                user: uId,
                date: date
            }
        };
        StampModel.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    this.bulkRemove = function (req, res, next) {
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var uId = req.session.uId;
        var date = moment();
        var data = {
            status: 'deleted',
            editedBy: {
                user: uId,
                date: date
            }
        };
        async.each(ids, function(id, cb){
            StampModel.findByIdAndUpdate(id, data, function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            });
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send({success: 'success'});
        });
    };

    this.getForDD = function (req, res, next) {
        var StampModel = models.get(req.session.lastDb, 'Stamps', StampSchema);

        StampModel
            .find()
            .select('_id name')
            .sort({name: 1})
            .lean()
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({data: result});
            });
    };
};

module.exports = stamp;
