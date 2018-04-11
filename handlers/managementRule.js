var mongoose = require('mongoose');
var async = require('async');

var Module = function (models) {
    'use strict';

    var managementRuleSchema = mongoose.Schemas.managementRule;
    var ObjectId = mongoose.Types.ObjectId;
    var pageHelper = require('../helpers/pageHelper');
    var mapObject = require('../helpers/bodyMaper');
    var FilterMapper = require('../helpers/filterMapper');

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;
        var data = req.query;
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var keySort;
        var managementRule = models.get(db, 'managementRule', managementRuleSchema);
        var sort;
        var filter = data.filter || {};
        var keySort;
        var optionsObject = {};
        var contentType = data.contentType;

        var filterMapper = new FilterMapper();
        if (filter && typeof filter === 'object') {
            optionsObject = filterMapper.mapFilter(filter, contentType); // caseFilter(filter);
        }

        var queryObject = {};
        queryObject.$and = [];
        if (optionsObject) {
            queryObject.$and.push(optionsObject);
        }

        if (data.sort) {
            keySort = Object.keys(data.sort)[0];
            data.sort[keySort] = parseInt(data.sort[keySort], 10);
            sort = data.sort;
        } else {
            sort = {'categoryNum': 1,'number': 1};
        }

        managementRule.aggregate([
            {
                $match: {
                    status: 'new'
                }
            },
            {
                $match: queryObject
            },
            {
                $project: {
                    categoryTex: 1,
                    categoryNum: 1,
                    number: 1,
                    content: 1,
                    penalty: 1,
                    status: 1
                }
            },
            {
                $group: {
                    _id: null,
                    total: {$sum: 1},
                    root: {$push: '$$ROOT'}
                }
            },
            {
                $unwind: '$root'
            },
            {
                $project:{
                    _id: '$root._id',
                    categoryNum: '$root.categoryNum',
                    categoryTex: '$root.categoryTex',
                    number: '$root.number',
                    content: '$root.content',
                    penalty: '$root.penalty',
                    status: '$root.status',
                    total: 1
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
        ], function(err, result){
            var count;
            var firstElement;
            var response = {};

            if (err) {
                return next(err);
            }

            firstElement = result[0];
            count = firstElement && firstElement.total ? firstElement.total : 0;
            response.total = count;
            response.data = result;
            res.status(200).send(response);
        })
    };

    this.create = function (req, res, next) {
        var db = req.session.lastDb;
        var managementRuleModel = models.get(db, 'managementRule', managementRuleSchema);
        var managementRule;
        var data = req.body;
        var uId = req.session.uId;
        var date = new Date();
        data.status = 'new';
        data.createdBy = {
            user: uId,
            date: date
        };
        managementRule = new managementRuleModel(data);
        managementRule.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var managementRule = models.get(db, 'managementRule', managementRuleSchema);
        var id = req.params.id;
        var uId = req.session.uId;
        var editedBy = {
            user: uId,
            date: new Date()
        };
        managementRule.findByIdAndUpdate(id, {status: 'deleted', editedBy:editedBy}, {new: true}, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.bulkRemove = function (req, res, next){
        var db = req.session.lastDb;
        var managementRule = models.get(db, 'managementRule', managementRuleSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var uId = req.session.uId;
        var date = new Date();
        var data = {
            status: 'deleted',
            editedBy: {
                user: uId,
                date: date
            }
        };
        async.each(ids, function(id, cb){
            managementRule.findByIdAndUpdate(id, data, {new: true}, function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            })
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send('deleted');
        });
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var managementRuleModel = models.get(db, 'managementRule', managementRuleSchema);
        var id = req.params.id;
        var uId = req.session.uId;
        var date = new Date();
        var data = req.body;
        data.status = 'new';
        managementRuleModel.findByIdAndUpdate(id, {status: 'edited'}, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }
            data.createdBy = {
                user: result.createdBy.user,
                date: result.createdBy.date
            };
            data.editedBy = {
                user: uId,
                date: date
            };
            var managementRule = new managementRuleModel(data);
            managementRule.save(function(err, result){
                if(err){
                    return next(err);
                }
                res.status(200).send(result);
            });
            
        });
    };

};
module.exports = Module;