var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var missionAllowanceSchema = mongoose.Schemas.missionAllowance;
    var sequenceSchema = mongoose.Schemas.sequence;
    var EmployeeSchema = mongoose.Schemas.Employee
    var objectId = mongoose.Types.ObjectId;
    var HistoryService = require('../services/history.js')(models);

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;

        var missionAllowance = models.get(db, 'missionAllowance', missionAllowanceSchema);

        missionAllowance
        .find({})
        .populate('name','_id name.first name.last')
        .populate('Department', '_id name')
        .populate('jobPosition', '_id name')
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
        var MissionAllowance = models.get(db, 'missionAllowance', missionAllowanceSchema);
        var sequence = models.get(req.session.lastDb, 'sequence', sequenceSchema);
        var missionAllowance;

        var body = req.body;
        body.createdBy = {
            user: req.session.uId,
            date: new Date()
        };
        body.status = 'new';
        sequence.findOneAndUpdate(
            { name: 'missionAllowance'},
            { $inc: { sequencevalue: 1 } }, 
            {new: true},
            function(err,sequence){
                if(err){
                    return next(err);
                }
                body.ID = sequence.sequencevalue;
                missionAllowance = new MissionAllowance(body);
                missionAllowance.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send(result);
                });
            });

        
    };

    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var missionAllowanceModel = models.get(db, 'missionAllowance', missionAllowanceSchema);
        var id = req.params.id;
        missionAllowanceModel.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.update = function (req, res, next){
        var dbName = req.session.lastDb;
        var missionAllowanceModel = models.get(dbName, 'missionAllowance', missionAllowanceSchema);
        var id = req.params.id;
        var data = req.body;
        data.editedBy = {
            user: req.session.uId,
            date: new Date()
        };

        missionAllowanceModel.findByIdAndUpdate(id, data, {new: true}, function(err, result){
            if(err){
                return next(err);
            }

            var historyOptions = {
                contentType: 'missionAllowance',
                data: data,
                dbName: dbName,
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

    this.getDepartmentAndJobPosition = function(req, res, next) {
        var Employee = models.get(req.session.lastDb, 'Employees', EmployeeSchema);
        var query = req.query;
        var id = query.id;


        Employee.aggregate([
            {
                $match:{
                    _id: objectId(id)
                }
            },{
                $lookup:{
                    from        : 'Department',
                    localField  : 'department',
                    foreignField: '_id',
                    as          : 'department'
                }
            },{
                $lookup:{
                    from        : 'JobPosition',
                    localField  : 'jobPosition',
                    foreignField: '_id',
                    as          : 'jobPosition'
                }
            },{
                $project:{
                    department: {$arrayElemAt: ['$department', 0]},
                    jobPosition: {$arrayElemAt: ['$jobPosition', 0]}
                }
            },{
                $project:{
                    'department._id': '$department._id',
                    'department.name': '$department.name',
                    'jobPosition._id': '$jobPosition._id',
                    'jobPosition.name': '$jobPosition.name'
                }
            }
        ],function(err,result){
            if(err){
                next(err);
            }
            res.status(200).send(result);
        });


    };

};
module.exports = Module;