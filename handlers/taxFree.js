var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var taxFreeSchema = mongoose.Schemas.taxFree;
    var HistoryService = require('../services/history.js')(models);

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var taxFree = models.get(db, 'taxFree', taxFreeSchema);

        taxFree
        .find({status: 'new'})
        .lean()
        .exec( function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.create = function (req, res, next) {
        var db = req.session.lastDb;
        var TaxFree = models.get(db, 'taxFree', taxFreeSchema);
        var taxFree;
        var data = req.body;
        data.status = 'new';
        data.createdBy = {
            user: req.session.uId,
            date: new Date()
        };
        taxFree = new TaxFree(data);
        taxFree.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var taxFreeModel = models.get(db, 'taxFree', taxFreeSchema);
        var id = req.params.id;

        taxFreeModel.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var taxFreeModel = models.get(db, 'taxFree', taxFreeSchema);
        var id = req.params.id;
        var data = req.body;
        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };

        taxFreeModel.findByIdAndUpdate(id, data, function (err, result) {
            if(err){
                return next(err);
            }

            var historyOptions = {
                contentType: 'taxFree',
                data: data,
                dbName: db,
                contentId: id
            };
            HistoryService.addEntry(historyOptions, function(err, result2){
                if(err){
                    return next(err);
                }
                res.status(200).send(result2);
            });
        });
    };

};
module.exports = Module;