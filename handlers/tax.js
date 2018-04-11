var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var taxSchema = mongoose.Schemas.tax;
    var HistoryService = require('../services/history.js')(models);

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var tax = models.get(db, 'tax', taxSchema);

        tax
        .find({})
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
        var Tax = models.get(db, 'tax', taxSchema);
        var tax;
        var data = req.body;
        data.createdBy = {
            user: req.session.uId,
            date: new Date()
        };
        tax = new Tax(data);
        tax.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var tax = models.get(db, 'tax', taxSchema);
        var id = req.params.id;
        tax.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var tax = models.get(db, 'tax', taxSchema);
        var id = req.params.id;
        var data = req.body;
        data.editedBy = {
            uesr: req.session.uId,
            date: new Date()
        };
        tax.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }

            var historyOptions = {
                contentType: 'tax',
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