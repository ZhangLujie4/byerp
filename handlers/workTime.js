var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var workTimeSchema = mongoose.Schemas.workTime;

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var workTime = models.get(db, 'workTime', workTimeSchema);

        workTime.find({}, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.getForDd = function (req, res, next) {
        var db = req.session.lastDb;
        var WeeklyScheduler = models.get(db, 'weeklyScheduler', WeeklySchedulerSchema);

        WeeklyScheduler.find({}, {name: 1}, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send({data: result});
        });
    };

    this.create = function (req, res, next) {
        var db = req.session.lastDb;
        var workTime = models.get(db, 'workTime', workTimeSchema);
        var workTime;
        console.log(req.body);
        workTime = new workTime(req.body);
        workTime.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var workTime = models.get(db, 'workTime', workTimeSchema);
        var id = req.params.id;

        workTime.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var workTime = models.get(db, 'workTime', workTimeSchema);
        var id = req.params.id;
        var data = req.body;

        workTime.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

};

module.exports = Module;
