/**
 * Created by wmt on 2017/7/25.
 */
var mongoose = require('mongoose');
var async = require('async');
var objectId = mongoose.Types.ObjectId;

var Module = function (models, event) {
    'use strict';

    var DepRoyaltySchema = mongoose.Schemas.DepRoyalty;
    var royaltyDetailsSchema = mongoose.Schemas.royaltyDetails;
    var EmployeeSchema = mongoose.Schemas.Employee;
    var DepartmentSchema = mongoose.Schemas.Department;
    var vocationDetailsSchema = mongoose.Schemas.vocationDetails;
    var typeSchema = mongoose.Schemas.Type;
    var royaltyDetailsService = require('../services/royaltyDetails')(models);
    var payrollService = require('../services/payroll')(models);
    var FilterMapper = require('../helpers/filterMapper');
    var filterMapper = new FilterMapper();

    function updateOnlySelectedFields(req, res, next) {
        var depRoyalty = models.get(req.session.lastDb, 'DepRoyalty', DepRoyaltySchema);
        var RoyaltyDetails = models.get(req.session.lastDb, 'royaltyDetails', royaltyDetailsSchema);
        var data = req.body;
        var id = req.params.id;
        var year = data.year;

        depRoyalty
            .findByIdAndUpdate(id, data, {new: true})
            .exec(function (err, depRoy) {
                if(err) {
                    return next(err);
                }

                var commission = 0;
                RoyaltyDetails.aggregate([{
                    $lookup: {
                        from        : 'Opportunities',
                        localField  : 'project',
                        foreignField: '_id',
                        as          : 'project'
                    }
                },{
                    $project: {
                        project  : {$arrayElemAt: ['$project', 0]},
                        comRate  : 1,
                        diffCoef : 1,
                        persons  : 1
                    }
                },{
                    $project: {
                        'project._id'       : '$project._id',
                        'project.bidCost'   : '$project.bidCost',
                        'project.biderDate' : '$project.biderDate',
                        'project.biderYear' : {$year: '$project.biderDate'},
                        comRate             : 1,
                        diffCoef            : 1,
                        persons             : 1      
                    }
                },{
                    $match: {
                        'project.biderYear' : year
                    }
                },{
                    $project: {
                        project  : 1,
                        comRate  : 1,
                        diffCoef : 1,
                        persons  : 1

                    }
                }], function (err, result) {

                    if (err) {
                        return next(err);
                    }

                    for(var i=0; i<result.length; i++){
                        var totalPay = result[i].project.bidCost*result[i].comRate/100;
                        for(var j=0; j<result[i].persons.length; j++){
                            var everyPay = totalPay*result[i].persons[j].scale/100 - result[i].persons[j].deductions;
                            if(result[i].persons[j].name.equals(depRoy.person)){
                                commission = commission + everyPay;
                            }
                        }
                    }

                    if(commission !== depRoy.commission){
                        depRoyalty
                            .findByIdAndUpdate(id, {commission: commission}, {new: true})
                            .exec(function (err, depRoy) {
                                if(err) {
                                    return next(err);
                                }
                            });
                    }
                    res.status(200).send(depRoy);
                });
        });
    }

    this.getByViewType = function (req, res, next) {
        var db = req.session.lastDb;
        var depRoyalty = models.get(db, 'DepRoyalty', DepRoyaltySchema);
        var data = req.query;
        var contentType = data.contentType;
        var filter = data.filter || {};
        var queryObject = {};
        queryObject.$and = [];

        if (filter && typeof filter === 'object') {
             queryObject.$and.push(filterMapper.mapFilter(filter, {contentType: contentType}));
        }

        var newQueryObj = {};
        newQueryObj.$and = [];
        newQueryObj.$and.push(queryObject);
        
        depRoyalty.aggregate([
            {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'person',
                    foreignField: '_id',
                    as          : 'person'
                }
            },{
                $project:{
                    person      : {$arrayElemAt: ['$person', 0]},
                    year        : 1,
                    guaSalary   : 1,
                    basePay     : 1,
                    ratedAtten  : 1,
                    effecAtten  : 1,
                    paidWages   : 1,
                    commission  : 1,
                    wBonuses    : 1,
                    description : 1
                }
            }, {
                $project: {
                    person : {
                        _id : '$person._id',
                        name: {$concat: ['$person.name.first', ' ', '$person.name.last']}
                    },
                    year          : 1,
                    guaSalary     : 1,
                    basePay       : 1,
                    ratedAtten    : 1,
                    effecAtten    : 1,
                    paidWages     : 1,
                    commission    : 1,
                    wBonuses      : 1,
                    description   : 1   
                }        
            }, {
                $project: {
                    person        : 1,
                    year          : 1,
                    guaSalary     : 1,
                    basePay       : 1,
                    ratedAtten    : 1,
                    effecAtten    : 1,
                    paidWages     : 1,
                    commission    : 1,
                    wBonuses      : 1,
                    description   : 1   
              }
            }, {
                $match: newQueryObj
            }],function(err,result){
                var response = {};

                if (err) {
                    return next(err);
                }
                response.total = result.length;
                response.data = result;
                res.status(200).send(response);
            });
    };

    this.create = function (req, res, next) {
        var body = req.body;
        var depRoyalty = models.get(req.session.lastDb, 'DepRoyalty', DepRoyaltySchema);
        var Department = models.get(req.session.lastDb, 'Department', DepartmentSchema);
        var Employees = models.get(req.session.lastDb, 'Employees', EmployeeSchema);
        var vocationDetails = models.get(req.session.lastDb, 'vocationDetails', vocationDetailsSchema);
        var Type = models.get(req.session.lastDb, 'Type', typeSchema);
        var year = parseInt(body.year);
        var ratedAtten = 365;
        var depRoyaltys = [];
        var departmentSearcher;
        var vocationSearcher;
        var employeesSearcher;
        var contentSearcher;
        var waterfallTasks;

        departmentSearcher = function (waterfallCallback) {
            Department.aggregate(
                {
                    $match: {
                        name: "商务部"
                    }
                }, {
                    $lookup: {
                        from        : 'Type',
                        localField  : 'type',
                        foreignField: '_id',
                        as          : 'type'
                    }
                }, {
                    $project: {
                        _id       : 1,
                        type  : {$arrayElemAt: ['$type', 0]},
                    }
                }, {
                    $project: {
                        _id  : 1,
                        type : 1
                    }
                },
                waterfallCallback);
        };

        vocationSearcher = function (deps, waterfallCallback) {
            vocationDetails.aggregate([{
                    $project: {
                        year : {$year: '$date'},
                        type : 1
                    }
                },{
                    $match: {
                        year: year
                    }
                }], function (err, vocs) {
                    if (err) {
                        waterfallCallback(err);
                    }
                    for(var i=0; i<vocs.length; i++){
                        for(var j=0; j<vocs[i].type.length; j++){
                            if(vocs[i].type[j].equals(deps[0].type._id)){
                                ratedAtten--;
                            }
                        }
                    }
                    waterfallCallback(null,deps);
            });
        };

        employeesSearcher = function (deps, waterfallCallback){
            Employees.aggregate([
                {
                    $match: {
                        department: deps[0]._id
                    }
                }, {
                    $project: {
                        _id: 1
                    }
                }], function (err, employees) {
                    if (err) {
                        waterfallCallback(err);
                    }

                    async.map(employees, function (emp, callback) {
                            var depRoyalty = {};

                            depRoyalty._id = objectId();
                            depRoyalty.person = emp._id;
                            depRoyalty.year = year;
                            depRoyalty.ratedAtten = ratedAtten;
                            depRoyalty.guaSalary = 0;
                            depRoyalty.basePay = 0;
                            depRoyalty.wBonuses = 0;

                            royaltyDetailsService.getRoyaltyByPersonAndYear({depRoyalty:depRoyalty,dbName:req.session.lastDb}, function (err, commission) {

                                depRoyalty.commission = commission;

                                payrollService.getPaidAndAttenForRoyalty({depRoyalty: depRoyalty, dbName:req.session.lastDb}, function (err, depRoyalty){

                                    callback(null, depRoyalty);
                                });
                            });

                        }, function (err, depRoyalty) {
                            if (err) {
                                return waterfallCallback(err);
                            }

                            depRoyaltys.push(depRoyalty);
                            waterfallCallback(null, depRoyaltys);
                    });

            });
        };

        waterfallTasks = [departmentSearcher, vocationSearcher, employeesSearcher];

        async.waterfall(waterfallTasks, function (err, depRoyaltys) {

            if (err) {
                return next(err);
            }

            depRoyalty.collection.insertMany(depRoyaltys[0], function (err) {
                    if (err) {
                        console.log(err);
                    }
                    res.status(200).send(depRoyaltys);
            });
        });

    };

    this.updateOnlySelectedFields = function (req, res, next) {
        updateOnlySelectedFields(req, res, next);
    };

    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'DepRoyalty', DepRoyaltySchema);
        var body = req.body || {ids: []};
        var deleteHistory = req.query.deleteHistory;
        var ids = body.ids;

        Model.remove({_id: {$in: ids}}, function (err, removed) {
            if (err) {
                return next(err);
            }
            if (deleteHistory) {
                historyWriter.deleteHistoryById(req, {contentId: {$in: ids}});
            }

            res.status(200).send(removed);
        });
    };

};

module.exports = Module;