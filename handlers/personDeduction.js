var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var personDeductionSchema = mongoose.Schemas.personDeduction;

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var personDeduction = models.get(db, 'personDeduction', personDeductionSchema);

        personDeduction
        .find({})
        .populate('employee','_id name.first name.last')
        .lean()
        .exec( function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.getForDd = function(req, res, next){
        var db = req.session.lastDb;
        var personDeduction = models.get(db, 'personDeduction', personDeductionSchema);

        personDeduction.aggregate([
                {
                    $project: {
                        _id           : 1,
                        allowanceName : 1,

                    },
                }
            ],function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
            
    };

    this.create = function (req, res, next) {
        var db = req.session.lastDb;
        var personDeduction = models.get(db, 'personDeduction', personDeductionSchema);
        var body = req.body;
        body.createdBy = {
            user: req.session.uId,
            date: new Date()
        };
        console.log(body);
        personDeduction = new personDeduction(body);
        personDeduction.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var personDeduction = models.get(db, 'personDeduction', personDeductionSchema);
        var id = req.params.id;

        personDeduction.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var personDeduction = models.get(db, 'personDeduction', personDeductionSchema);
        var id = req.params.id;
        var data = req.body;
        data.editedBy.user = req.session.uId;
        personDeduction.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

};
module.exports = Module;