var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var personExternalSchema = mongoose.Schemas.personExternal;

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var personExternal = models.get(db, 'personExternal', personExternalSchema);

        personExternal
        .find({})
        .populate('employee','_id name.first name.last')
        .populate('editedBy.user')
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
        var PersonExternal = models.get(db, 'personExternal', personExternalSchema);

        PersonExternal.aggregate([
                {
                    $project: {
                        _id           : 1,
                        allowanceName : 1
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
        var PersonExternal = models.get(db, 'personExternal', personExternalSchema);
        var personExternal;

        var body = req.body;
        body.createdBy = {
            user: req.session.uId,
            date: new Date()
        };

        personExternal = new PersonExternal(body);
        personExternal.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var personExternal = models.get(db, 'personExternal',personExternalSchema);
        var id = req.params.id;

        personExternal.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var personExternal = models.get(db, 'personExternal', personExternalSchema);
        var id = req.params.id;
        var data = req.body;
        data.editedBy.user = req.session.uId;
        personExternal.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

};
module.exports = Module;