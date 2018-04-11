var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var departmentExternalSchema = mongoose.Schemas.departmentExternal;

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var departmentExternal = models.get(db, 'departmentExternal', departmentExternalSchema);

        departmentExternal
        .find({})
        .populate('department','_id name')
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
        var DepartmentExternal = models.get(db, 'departmentExternal', departmentExternalSchema);
        var departmentExternal;

        departmentExternal = new DepartmentExternal(req.body);
        departmentExternal.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var departmentExternal = models.get(db, 'departmentExternal', departmentExternalSchema);
        var id = req.params.id;

        departmentExternal.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var departmentExternal = models.get(db, 'departmentExternal', departmentExternalSchema);
        var id = req.params.id;
        var data = req.body;

        departmentExternal.findByIdAndUpdate(id, data, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

};
module.exports = Module;