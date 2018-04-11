/**
 * Created by wmt on 2017/7/25.
 */
var royaltyDetails = function (models, event) {
    'use strict';

    var mongoose = require('mongoose');
    var royaltyDetailsSchema = mongoose.Schemas.royaltyDetails;
    var employeeSchema = mongoose.Schemas.Employee;
    var opportunitiesSchema = mongoose.Schemas.Opportunitie;
    var DepRoyaltySchema = mongoose.Schemas.DepRoyalty;
    var async = require('async');
    var objectId = mongoose.Types.ObjectId;
    var FilterMapper = require('../helpers/filterMapper');
    var filterMapper = new FilterMapper();


    function updateOnlySelectedFields(req, res, next) {
        var mid = parseInt(req.headers.mid, 10);
        var index = 0;
        var royaltyDetails = models.get(req.session.lastDb, 'royaltyDetails', royaltyDetailsSchema);
        var Opportunitie = models.get(req.session.lastDb, 'Opportunitie', opportunitiesSchema);
        var RoyaltyDetails = models.get(req.session.lastDb, 'royaltyDetails', royaltyDetailsSchema);
        var depRoyalty = models.get(req.session.lastDb, 'DepRoyalty', DepRoyaltySchema);
        var data = req.body.data;
        var id = req.params.id;
        var year = req.body.year;
        var person = {};
        var persons = [];
        var personsNew = [];
        var result = {};

        if(mid === 1){
            person.name = objectId(data.name);
            person.scale = parseInt(data.scale);
            person.deductions = parseInt(data.deductions);
            async.waterfall([
                function (wCb) {
                    royaltyDetails.findById(id, function (err, roy) {
                        if (err) {
                            return wCb(err);
                        }
                        wCb(null, roy);
                    });
                },
                function (roy, wCb) {
                    persons = roy.persons;
                    for(var i=0; i<persons.length; i++){
                        if(persons[i].name.equals(person.name)){
                            persons[i] = person;
                        }
                    }
                    
                    royaltyDetails
                        .findByIdAndUpdate(id, {persons:persons}, {new: true})
                        .exec(function (err, result) {
                            if(err) {
                                return next(err);
                            }

                            result = result;
                            wCb(null, result);
                    });
                }
               ], function (err) {
                    if (err) {
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
                                if(result[i].persons[j].name.equals(person.name)){
                                    commission = commission + everyPay;
                                }
                            }
                        }
                        
                        depRoyalty
                            .findOneAndUpdate({person: person.name}, {commission: commission}, {new: true})
                            .exec(function (err, result) {
                                if(err) {
                                    return next(err);
                                }
                        });
                    });
                    res.status(200).send(result); 
            });
        }else if(mid === 2){
            person.name = objectId(data.name);
            person.scale = parseInt(data.scale);
            person.deductions = parseInt(data.deductions);
            async.waterfall([
                function (wCb) {
                    royaltyDetails.findById(id, function (err, roy) {
                        if (err) {
                            return wCb(err);
                        }
                        wCb(null, roy);
                    });
                },
                function (roy, wCb) {
                    persons = roy.persons;
                    persons.push(person);
                    royaltyDetails
                        .findByIdAndUpdate(id, {persons:persons}, {new: true})
                        .exec(function (err, result) {
                            if(err) {
                                return next(err);
                            }

                            result = result;
                            wCb(null, result);
                    });
                }
               ], function (err) {
                    if (err) {
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
                                if(result[i].persons[j].name.equals(person.name)){
                                    commission = commission + everyPay;
                                }
                            }
                        }
                        
                        depRoyalty
                            .findOneAndUpdate({person: person.name}, {commission: commission}, {new: true})
                            .exec(function (err, result) {
                                if(err) {
                                    return next(err);
                                }
                        });
                    });

                    res.status(200).send(result); 
            });
        }else if(mid === 3){
            person.name = objectId(data.name);
            person.scale = parseInt(data.scale);
            person.deductions = parseInt(data.deductions);
            async.waterfall([
                function (wCb) {
                    royaltyDetails.findById(id, function (err, roy) {
                        if (err) {
                            return wCb(err);
                        }
                        wCb(null, roy);
                    });
                },
                function (roy, wCb) {
                    persons = roy.persons;
                    for(var i=0; i<persons.length; i++){
                        if(persons[i].name.equals(person.name)){
                            index = i;
                        }
                    }

                    for(var i=0; i<persons.length; i++){
                        if(i !== index){
                            personsNew.push(persons[i]);
                        }
                    }
                    
                    royaltyDetails
                        .findByIdAndUpdate(id, {persons:personsNew}, {new: true})
                        .exec(function (err, result) {
                            if(err) {
                                return next(err);
                            }

                            result = result;
                            wCb(null, result);
                    });
                }
               ], function (err) {
                    if (err) {
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
                                if(result[i].persons[j].name.equals(person.name)){
                                    commission = commission + everyPay;
                                }
                            }
                        }
                        
                        depRoyalty
                            .findOneAndUpdate({person: person.name}, {commission: commission}, {new: true})
                            .exec(function (err, result) {
                                if(err) {
                                    return next(err);
                                }
                        });
                    });
                    res.status(200).send(result); 
            });
        }else {
            royaltyDetails
                .findByIdAndUpdate(id, data, {new: true})
                .exec(function (err, result) {
                    if(err) {
                        return next(err);
                    }

                    if(result.persons.length){
                        async.each(result.persons, function (person, cb) {
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
                                        if(result[i].persons[j].name.equals(person.name)){
                                            commission = commission + everyPay;
                                        }
                                    }
                                }
                                
                                depRoyalty
                                    .findOneAndUpdate({person: person.name}, {commission: commission}, {new: true})
                                    .exec(function (err, result) {
                                        if(err) {
                                            return next(err);
                                        }
                                });
                            });
                        }, function (err) {
                            if (err) {
                                return next(err);
                            }
                        });
                    }
                    res.status(200).send(result);
            });
        }
    }

    function getRoyaltyDetailsFilter(req, res, next) {
        var query = req.query;
        var royaltyDetails = models.get(req.session.lastDb, 'royaltyDetails', royaltyDetailsSchema);
        var employee = models.get(req.session.lastDb, 'Employee', employeeSchema);
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

        royaltyDetails.aggregate([{
            $lookup: {
                from        : 'Opportunities',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        },{
            $project: {
                project    : {$arrayElemAt: ['$project', 0]},
                comRate    : 1,
                diffCoef   : 1,
                persons    : 1
            }
        }, {
            $project: {
               'project._id'       : '$project._id',
               'project.name'      : '$project.name',
               'project.bidCost'   : '$project.bidCost',
               'project.biderDate' : '$project.biderDate',  
                year       : {$year: '$project.biderDate'}, 
                comRate    : 1,
                diffCoef   : 1,
                persons    : 1
            }
        }, {
            $match: newQueryObj
        }])
        .exec(function (err, result) {
            if (err) {
                return next(err);
            }
            async.map(result, function (item, cb) {
                async.map(item.persons, function (person, callback) {
                    employee.findById(person.name).exec(function (err, emp) {
                            if (err) {
                                return callback(err);
                            }
                            person.name = emp;
                            callback(null, person);
                    });

                }, function (err, empRes) {
                    if (err) {
                        return cb(err);
                    }
                    item.persons = empRes;
                    cb(null, item.persons);
                });
                
            }, function (err, itemRes) {
                var response = {};

                if (err) {
                    return next(err);
                }
                response.total = result.length;
                response.data = result;
                res.status(200).send(response);
            });

        });
    }

    function getRoyaltyDetailsById(req, res, next) {
        var id = req.query.id || req.params.id;
        var royaltyDetails = models.get(req.session.lastDb, 'royaltyDetails', royaltyDetailsSchema);
        var employee = models.get(req.session.lastDb, 'Employee', employeeSchema);

        royaltyDetails.aggregate([{
            $match: {
                _id : objectId(id)         
            }
        },{
            $lookup: {
                from        : 'Opportunities',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        },{
            $project: {
                project    : {$arrayElemAt: ['$project', 0]},
                comRate    : 1,
                diffCoef   : 1,
                persons    : 1
            }
        },{
            $project: {
               'project._id'       : '$project._id',
               'project.name'      : '$project.name',
               'project.bidCost'   : '$project.bidCost',
               'project.biderDate' : '$project.biderDate',  
                year       : {$year: '$project.biderDate'},  
                comRate    : 1,
                diffCoef   : 1,
                persons    : 1
            }
        }])
        .exec(function (err, result) {
            if (err) {
                return next(err);
            }
            async.map(result, function (item, cb) {
                async.map(item.persons, function (person, callback) {
                    employee.findById(person.name).exec(function (err, emp) {
                            if (err) {
                                return callback(err);
                            }
                            person.name = emp;
                            callback(null, person);
                    });

                }, function (err, empRes) {
                    if (err) {
                        return cb(err);
                    }
                    item.persons = empRes;
                    cb(null, item.persons);
                });
                
            }, function (err, itemRes) {
                if (err) {
                    return next(err);
                }
                result = result[0];
                res.status(200).send(result);
            });

        });
    }

    this.create = function (req, res, next) {
        var body = req.body;
        var royaltyDetails = models.get(req.session.lastDb, 'royaltyDetails', royaltyDetailsSchema);
        var Opportunities = models.get(req.session.lastDb, 'Opportunities', opportunitiesSchema);
        var year = parseInt(body.year);
        var result = [];

        Opportunities.aggregate([{
                $project: {
                    _id  : 1,
                    year : {$year: '$biderDate'}
                }
            },{
                $match: {
                    year: year
                }
            }], function (err, opps) {
                if (err) {
                    return next(err);
                }

                if(opps.length){
                    for(var i=0; i<opps.length; i++){
                        var royaltyDetail = {};
                        royaltyDetail.project = opps[i]._id;
                        royaltyDetail.comRate = 0;
                        royaltyDetail.persons = [];
                        result.push(royaltyDetail);
                    }

                    royaltyDetails.collection.insertMany(result, function (err) {
                            if (err) {
                                console.log(err);
                            }
                            res.status(200).send(result);
                    });
                }else{
                    res.status(200).send("暂无此年份的投标工程！");
                }
        });
    };

    this.getForView = function (req, res, next) {
        var viewType = req.query.viewType;
        var id = req.query.id || req.params.id;

        if (id && id.length >= 24) {
            return getRoyaltyDetailsById(req, res, next);
        } else if (id && id.length < 24) {
            return res.status(400).send();
        }

        switch (viewType) {
            case 'list':
            case 'thumbnails':
                getRoyaltyDetailsFilter(req, res, next);
                break;
            case 'form':
                getRoyaltyDetailsById(req, res, next);
                break;
            default:
                getRoyaltyDetailsFilter(req, res, next);
                break;
        }
    };

    this.updateOnlySelectedFields = function (req, res, next) {
        updateOnlySelectedFields(req, res, next);
    };

    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'royaltyDetails', royaltyDetailsSchema);
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

module.exports = royaltyDetails;
