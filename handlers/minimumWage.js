var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var minimumWageSchema = mongoose.Schemas.minimumWage;
    var HistoryService = require('../services/history.js')(models);

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var minimumWage = models.get(db, 'minimumWage', minimumWageSchema);

        minimumWage
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
        var MinimumWage = models.get(db, 'minimumWage', minimumWageSchema);
        var minimumWage;
        var data = req.body;
        data.createdBy = {
            user: req.session.uId,
            date: new Date()
        };
        minimumWage = new MinimumWage(data);
        minimumWage.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var minimumWage = models.get(db, 'minimumWage', minimumWageSchema);
        var id = req.params.id;

        minimumWage.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var minimumWage = models.get(db, 'minimumWage', minimumWageSchema);
        var id = req.params.id;
        var data = req.body;
        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };
        minimumWage.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            var historyOptions = {
                contentType: 'minimumWage',
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