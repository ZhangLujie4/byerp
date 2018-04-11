var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var moment = require('../public/js/libs/moment/moment');
var xlsx = require("node-xlsx");

var socialInsurance = function (models) {
    'use strict';

    var StampSchema = mongoose.Schemas.Stamp;
    var stampApplicationSchema = mongoose.Schemas.stampApplication;
    var userSchema = mongoose.Schemas.User;
    var EmployeeSchema = mongoose.Schemas.Employee;
    var DepartmentSchema = mongoose.Schemas.Department;
    var stampApprovalSchema = mongoose.Schemas.stampApproval;
    var socialInsuranceSchema = mongoose.Schemas.socialInsurance;

    var async = require('async');
    var path = require('path');
    var RESPONSES = require('../constants/responses');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();

    this.getForView = function (req, res, next) {
        var socialInsuranceModel = models.get(req.session.lastDb, 'socialInsurance', socialInsuranceSchema);
        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType;
        var uId = req.session.uId;
        var sort;
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var optionsObject = {};
        var parallelTasks;
        var keySort;
        console.log(filter);
        var datekey = filter.datekey ? filter.datekey.value.toString() : null;
        var year = datekey ? parseInt(datekey.substr(0, 4)) : moment(new Date()).year();
        var month = datekey ? parseInt(datekey.substr(4, 2)) : moment(new Date()).month() + 1;
        var filterMapper = new FilterMapper();
        delete filter.datekey;
        if (filter && typeof filter === 'object') {
            delete filter.startDate;
            optionsObject = filterMapper.mapFilter(filter, {contentType: contentType}); // caseFilter(filter);
        }

        var queryObject = {};
        queryObject.$and = [];
        if (optionsObject) {
            queryObject.$and.push(optionsObject);
        }
        console.log(queryObject);
        if (data.sort) {
            keySort = Object.keys(data.sort)[0];
            data.sort[keySort] = parseInt(data.sort[keySort], 10);
            sort = data.sort;
        } else {
            sort = {'year': 1, 'month': 1, 'name': 1};
        }

        var getTotal = function(cb){
            socialInsuranceModel.find({year:year, month:month}).find(queryObject).count(function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            });
        }
        var getData = function(cb){
             socialInsuranceModel.aggregate([
                {
                    $match: {
                        year: year,
                        month: month
                    }
                },
                {
                    $match: queryObject
                },
                {
                    $lookup:{
                        from: 'Department',
                        localField: 'department',
                        foreignField: '_id',
                        as: 'department'
                    }
                },
                {
                    $project: {
                        name : 1,
                        ID   : 1,
                        socialInsuranceNumber : 1,
                        year : 1,
                        month: 1,
                        endowmentCol : 1,
                        endowmentInd : 1,
                        unemployeeCol: 1,
                        unemployeeInd: 1,
                        medicalCol  : 1,
                        medicalInd  : 1,
                        maternityCol: 1,
                        maternityInd: 1,
                        injuryCol   : 1,
                        injuryInd   : 1,
                        cityHealth  : 1,
                        department  : {$arrayElemAt: ['$department', 0]},
                        departmentClass: 1,
                        chargeStatus : 1,
                        chargeDate : 1
                    }
                },
                {
                    $project: {
                        name : 1,
                        ID   : 1,
                        socialInsuranceNumber : 1,
                        year : 1,
                        month: 1,
                        endowmentCol : 1,
                        endowmentInd : 1,
                        unemployeeCol: 1,
                        unemployeeInd: 1,
                        medicalCol  : 1,
                        medicalInd  : 1,
                        maternityCol: 1,
                        maternityInd: 1,
                        injuryCol   : 1,
                        injuryInd   : 1,
                        cityHealth  : 1,
                        'department.name'  : '$department.name',
                        'department._id'   : '$department._id',
                        departmentClass: 1,
                        chargeStatus : 1,
                        chargeDate : 1
                    }
                },
                {
                    $sort: sort
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ],function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            });
        }

        async.parallel([getTotal, getData], function(err, result){
            if(err){
                return next(err);
            }
            var count;
            var response = {};
            count = result[0] || 0;

            response.total = count;
            response.data = result[1];

            res.status(200).send(response);
        })
       

    };

    this.importFile = function(req, res, next){
        var data = req.body;
        var datekey = req.params.id;
        var year = datekey.substr(0, 4);
        var month = datekey.substr(4, 2);

        var file = req.files && req.files.file ? req.files.file : null;
        var socialInsuranceModel = models.get(req.session.lastDb, 'socialInsurance', socialInsuranceSchema);
        var EmployeeModel = models.get(req.session.lastDb, 'Employees', EmployeeSchema);
        var userId = req.session.uId;
        var list = xlsx.parse(file.path);
        var xlsData = {}; 
        var result = [];
        var dimission = [];
        var inexistence = [];
        var existence = [];

        for(var i = 0; i < list.length; i++){
            if(list[i].data.length != 0){
                list[i].data.shift();
            }

            for(var j = 0; j < list[i].data.length; j++){
                if(list[i].data[j][0] != null || list[i].data[j][1] != null){
                    var socialInsuranceNumber = list[i].data[j][0];
                    var ID = list[i].data[j][1];
                    var name = list[i].data[j][2];
                    var type = list[i].data[j][3];
                    var col = list[i].data[j][7];
                    var ind = list[i].data[j][8];
                    var data = {
                        name: name,
                        socialInsuranceNumber: socialInsuranceNumber,
                        ID: ID,
                        type: type,
                        col: col,
                        ind: ind
                    }
                    if(!xlsData[ID]){
                        xlsData[ID] = [];
                    }
                    
                    xlsData[ID].push(data);
                }
                
            }
        }
        async.each(Object.keys(xlsData), function(key, cb){
            var name = xlsData[key][0].name;
            var ID = key;
            var socialInsuranceNumber = xlsData[key][0].socialInsuranceNumber;
            var department;
            var employee;
            var chargeStatus = false;
            var endowmentCol = 0;
            var endowmentInd = 0;
            var medicalCol = 0;
            var medicalInd = 0;
            var unemployeeCol = 0;
            var unemployeeInd = 0;
            var injuryCol = 0;
            var injuryInd = 0;
            var maternityCol = 0;
            var maternityInd = 0;
            for(var i = 0; i < xlsData[key].length; i++){
                if(xlsData[key][i].type == "企业养老"){
                    endowmentCol = xlsData[key][i].col;
                    endowmentInd = xlsData[key][i].ind;
                }
                if(xlsData[key][i].type == "医疗保险"){
                    medicalCol = xlsData[key][i].col;
                    medicalInd = xlsData[key][i].ind;
                }
                if(xlsData[key][i].type == "失业保险"){
                    unemployeeCol = xlsData[key][i].col;
                    unemployeeInd = xlsData[key][i].ind;
                }
                if(xlsData[key][i].type == "工伤保险"){
                    injuryCol = xlsData[key][i].col;
                    injuryInd = xlsData[key][i].ind;
                }
                if(xlsData[key][i].type == "生育保险"){
                    maternityCol = xlsData[key][i].col;
                    maternityInd = xlsData[key][i].ind;
                }
            }
            socialInsuranceModel.findOne({'ID': ID, 'year':year, 'month': month}, function(err, siResult){
                if(err){
                    return next(err);
                }
                if(siResult){
                    var existenceData = {
                        name: name,
                        ID  : ID,
                        socialInsuranceNumber: socialInsuranceNumber,
                        reason: '该月份数据已在表中'
                    }
                    existence.push(existenceData);
                    cb(null, siResult);
                }
                else{
                    EmployeeModel.findOne({'identNo': ID}, function(err, mod){
                        if(err){
                            return cb(err);
                        }

                        if(!mod){
                            var inexistenceData = {
                                name: name,
                                ID  : ID,
                                socialInsuranceNumber: socialInsuranceNumber,
                                reason: '不在员工表中'
                            }
                            inexistence.push(inexistenceData);

                            var dataTotal = {
                                name: name,
                                ID  : ID,
                                socialInsuranceNumber: socialInsuranceNumber,
                                year: year,
                                month: month,
                                chargeStatus: chargeStatus,
                                endowmentCol: endowmentCol? endowmentCol: 0,
                                endowmentInd: endowmentInd? endowmentInd: 0,
                                medicalCol  : medicalCol? medicalCol: 0,
                                medicalInd  : medicalInd? medicalInd: 0,
                                unemployeeCol: unemployeeCol? unemployeeCol: 0,
                                unemployeeInd: unemployeeInd? unemployeeInd: 0,
                                injuryCol : injuryCol? injuryCol: 0,
                                injuryInd : injuryInd? injuryInd: 0,
                                maternityCol: maternityCol? maternityCol: 0,
                                maternityInd: maternityInd? maternityInd: 0
                            };
                            var socialInsurance = new socialInsuranceModel(dataTotal);
                            socialInsurance.save(function(err, result){
                                if(err){
                                    return next(err);
                                }
                                cb(null, result);
                            });
                        }
                        else{
                            department = mod.department;
                            employee = mod._id;
                            var dataTotal = {
                                name: name,
                                ID  : ID,
                                socialInsuranceNumber: socialInsuranceNumber,
                                year: year,
                                month: month,
                                chargeStatus: chargeStatus,
                                endowmentCol: endowmentCol? endowmentCol: 0,
                                endowmentInd: endowmentInd? endowmentInd: 0,
                                medicalCol  : medicalCol? medicalCol: 0,
                                medicalInd  : medicalInd? medicalInd: 0,
                                unemployeeCol: unemployeeCol? unemployeeCol: 0,
                                unemployeeInd: unemployeeInd? unemployeeInd: 0,
                                injuryCol : injuryCol? injuryCol: 0,
                                injuryInd : injuryInd? injuryInd: 0,
                                maternityCol: maternityCol? maternityCol: 0,
                                maternityInd: maternityInd? maternityInd: 0,
                                department: department? department: '',
                                employee: employee
                            };

                            if(!mod.isEmployee){
                                var dimissionData = {
                                    name: name,
                                    ID  : ID,
                                    socialInsuranceNumber : socialInsuranceNumber,
                                    reason: '离职'
                                }
                                dimission.push(dimissionData);
                            }

                            var socialInsurance = new socialInsuranceModel(dataTotal);
                            socialInsurance.save(function(err, result){
                                if(err){
                                    return next(err);
                                }
                                cb(null, result);
                            });
                        }

                    });
                }
            });
        }, function(err){
            if(err){
                return next(err);
            }
            
            result = inexistence.concat(dimission, existence);

            res.status(200).send(result);
        });

    };

    this.importCityHealth = function(req, res, next){
        var datekey = req.params.id;
        var file = req.files && req.files.file ? req.files.file : null;
        var socialInsuranceModel = models.get(req.session.lastDb, 'socialInsurance', socialInsuranceSchema);
        var list = xlsx.parse(file.path);
        var year = datekey.substr(0, 4);
        var month = datekey.substr(4, 2);
        async.each(list, function(listItem, cb){
            if(listItem.data.length != 0){
                listItem.data.shift();
            }
            async.each(listItem.data, function(item, asyncCb){
                var ID = item[1];
                var cityHealth = item[3];
                socialInsuranceModel.find({year: year, month: month, ID: ID}, function(err, mod){
                    if(err){
                        return asyncCb(err);
                    }
                    if(mod.length){
                        var sId = mod[0]._id;
                        var data = {
                            cityHealth: cityHealth
                        };

                        socialInsuranceModel.findByIdAndUpdate(sId, data, function(err, result){
                            if(err){
                                return asyncCb(err);
                            }
                            asyncCb(null);
                        });
                    }
                    else{
                        asyncCb(null);
                    }
                });
            },function(err){
                if(err){
                    return cb(err);
                }
                cb(null, 'OK')
            });
        }, function(err){
            if(err){
                return next(err);
            }

            res.status(200).send('OK');
        });

    };

};

module.exports = socialInsurance;
