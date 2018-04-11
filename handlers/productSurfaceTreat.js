var mongoose = require('mongoose');
var async = require('async');

var Module = function (models) {
    'use strict';

    var productSurfaceTreatSchema = mongoose.Schemas.productSurfaceTreat;
    var pageHelper = require('../helpers/pageHelper');
    var mapObject = require('../helpers/bodyMaper');
    var FilterMapper = require('../helpers/filterMapper');

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;
        var productSurfaceTreat = models.get(db, 'productSurfaceTreat', productSurfaceTreatSchema);

        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType;
        var uId = req.session.uId;
        // var sort = data.sort || {};
        var sort;
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var optionsObject = {};
        var keySort;

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
            sort = {'name': 1};
        }

        productSurfaceTreat.aggregate([
            {
                $match: {
                    status: 'new'
                }
            },
            {
                $match: queryObject
            },
            {
                $lookup: {
                    from: 'Customers',
                    localField: 'supplier',
                    foreignField: '_id',
                    as: 'supplier'
                }
            },
            {
                $project: {
                    name: 1,
                    price: 1,
                    supplier: {$arrayElemAt: ['$supplier', 0]}
                }
            },
            {
                $project: {
                    name: 1,
                    price: 1,
                    'supplier.name': '$supplier.name',
                    'supplier._id': '$supplier._id'
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
                $project: {
                    _id: '$root._id',
                    name: '$root.name',
                    price: '$root.price',
                    'supplier.name': '$root.supplier.name',
                    'supplier._id': '$root.supplier._id',
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
            if(err){
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
        var productSurfaceTreatModel = models.get(db, 'productSurfaceTreat', productSurfaceTreatSchema);
        var productSurfaceTreat;
        var data = req.body;
        var uId = req.session.uId;
        data.createdBy = {
            user: uId,
            date: new Date()
        },
        data.status = 'new';

        productSurfaceTreat = new productSurfaceTreatModel(data);
        productSurfaceTreat.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.remove = function (req, res, next) {
        var db = req.session.lastDb;
        var productSurfaceTreatModel = models.get(db, 'productSurfaceTreat', productSurfaceTreatSchema);
        var id = req.params.id;
        var uId = req.session.uId;
        var data = {
            editedBy: {
                user: uId,
                date: new Date()
            },
            status: 'deleted'
        };
        productSurfaceTreat.findByIdAndUpdate(id, data, {new: true}, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.bulkRemove = function (req, res, next) {
        var productSurfaceTreat = models.get(req.session.lastDb, 'productSurfaceTreat', productSurfaceTreatSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;
        var uId = req.session.uId;
        var data = {
            status: 'deleted',
            editedBy: {
                user: uId,
                date: new Date()
            }
        };

        async.each(ids, function(id, cb){
            productSurfaceTreat.findByIdAndUpdate(id, data, {new: true}, function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            });
        }, function(err){
            if(err){
                return next(err);
            }
            res.status(200).send({success: 'removed'});
        })
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var productSurfaceTreatModel = models.get(db, 'productSurfaceTreat', productSurfaceTreatSchema);
        var id = req.params.id;
        var data = req.body;
        var uId = req.session.uId;

        productSurfaceTreatModel.findByIdAndUpdate(id, {status: 'edited'}, function (err, result) {
            if (err) {
                return next(err);
            }
            data.createdBy = {
                user: result.createdBy.user,
                date: result.createdBy.date
            };
            data.editedBy = {
                user: uId,
                date: new Date()
            };
            data.status = 'new';
            var productSurfaceTreat = new productSurfaceTreatModel(data);
            productSurfaceTreat.save(function(err, result2){
                if(err){
                    return next(err);
                }
                res.status(200).send(result2);
            });
        });
    };

};
module.exports = Module;