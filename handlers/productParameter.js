var mongoose = require('mongoose');
var _ = require('lodash');

var Module = function (models) {
    'use strict';
    var async = require('async');
    var productSchema = mongoose.Schemas.Product;
    var PayrollComponentTypesSchema = mongoose.Schemas.payrollComponentType;
    var payrollStructureTypesSchema = mongoose.Schemas.payrollStructureTypes;
    var ObjectId = mongoose.Types.ObjectId;


    this.getForView = function (req, res, next) {

        var db = req.session.lastDb;
        var productModel = models.get(db, 'Product', productSchema);

        productModel.aggregate([
            {
                $project: {
                    name: 1,
                    parameter: {
                        $filter: {
                            input: '$parameter',
                            as: 'item',

                            cond: {
                                $ne: ['$$item.status', 'deleted']
                            }
                        }
                    }
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
                    parameter: '$root.parameter',
                    total: 1
                }
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
        });
    };

    this.getById = function (req, res, next) {
        var db = req.session.lastDb;
        var productModel = models.get(db, 'Product', productSchema);
        var id = req.params.id;
        productModel.aggregate([
            {
                $match: {
                    _id: ObjectId(id),
                }
            },
            {
                $project:{
                    parameter: {
                        $filter: {
                            input: '$parameter',
                            as   : 'item',

                            cond: {
                                $ne: ['$$item.status', 'deleted']
                            }
                        }
                    },
                    formula: 1
                }
            }
        ], function(err, result){
            if (err) {
                return next(err);
            }
            result[0].parameter = _.sortBy(result[0].parameter, item =>  item.seq)
            res.status(200).send(result);
        });
    };

    this.getForDd = function (req, res, next) {
        var db = req.session.lastDb;
        var PayrollComponentType = models.get(db, 'PayrollComponentType', PayrollComponentTypesSchema);
        var type = req.params.type;
        var formula = req.query.formula;
        var query = {};

        if (type) {
            query.type = type;
        }

        if (formula) {
            query.formula = {$ne: []};
        }

        PayrollComponentType.find(query, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send({data: result});
        });
    };

    this.create = function (req, res, next) {
        var db = req.session.lastDb;
        var id = req.params.id;
        var data = req.body;
        var productModel = models.get(db, 'Product', productSchema);
        data.status = 'work';
        productModel.findByIdAndUpdate(id, {$addToSet: {'parameter': data}}, {new: true}, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
        
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var id = req.params.id;
        var productModel = models.get(db, 'Product', productSchema);
        var name = req.body;
        productModel.update({'_id':id, 'parameter.name': name}, {'parameter.$.status': 'deleted'}, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        })
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var productModel = models.get(db, 'Product', productSchema);
        var id = req.params.id;
        var data = req.body;
        var name = data.name;
        var value = data.value;
        var seq = data.seq;
        var prename = data.prename;
        var minRange = data.minRange;
        var maxRange = data.maxRange;
        var column = data.column;
      productModel.update({'_id':id, 'parameter.name': prename}, {'parameter.$.name': name, 'parameter.$.value': value, 'parameter.$.seq': seq, 'parameter.$.minRange': minRange, 'parameter.$.maxRange': maxRange, 'parameter.$.column': column}, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        })
    };

    this.updateFormula = function (req, res, next) {
        var db = req.session.lastDb;
        var productModel = models.get(db, 'Product', productSchema);
        var id = req.params.id;
        var data = req.body;
        productModel.findByIdAndUpdate(id, data, {new: true}, function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.getForDD = function (req, res, next) {
        var db = req.session.lastDb;
        var productModel = models.get(db, 'Product', productSchema);
        var id = req.query.id;
        console.log(id);
        productModel.aggregate([
            {
                $match: {
                    _id: ObjectId(id)
                }
            },
            {
                $project: {
                    parameter: {
                        $filter: {
                            input: '$parameter',
                            as: 'item',

                            cond: {
                                $ne: ['$$item.status', 'deleted']
                            }
                        }
                    }
                }
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        });
    };

};

module.exports = Module;
