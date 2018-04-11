var mongoose = require('mongoose');
var moment = require('../public/js/libs/moment/moment');

var Module = function (models) {
    'use strict';

    var PayRollSchema = mongoose.Schemas.PayRoll;
    var EmployeeSchema = mongoose.Schemas.Employees;
    var PayrollComponentTypeSchema = mongoose.Schemas.payrollComponentTypes;
    var journalEntrySchema = mongoose.Schemas.journalEntry;
    var VacationSchema = mongoose.Schemas.Vacation;
    var personExternalSchema = mongoose.Schemas.personExternal;
    var taxSchema = mongoose.Schemas.tax;
    var taxFreeSchema = mongoose.Schemas.taxFree;
    var personDeductionSchema = mongoose.Schemas.personDeduction;
    var minimumWageSchema = mongoose.Schemas.minimumWage;
    var socialInsuranceSchema = mongoose.Schemas.socialInsurance;
    var attendanceSchema = mongoose.Schemas.attendance;
    var holidaySchema = mongoose.Schemas.Holiday;
    var tcardSchema = mongoose.Schemas.timeCard;
    var ObjectId = mongoose.Types.ObjectId;



    var CONSTANTS = require('../constants/mainConstants.js');
    var _ = require('lodash');
    var async = require('async');
    var mapObject = require('../helpers/bodyMaper');
    var pageHelper = require('../helpers/pageHelper');
    var departmentArray = CONSTANTS.NOT_DEV_ARRAY;
    var journalArray = [
        ObjectId(CONSTANTS.SALARY_PAYABLE),
        ObjectId(CONSTANTS.OVERTIME_PAYABLE),
        ObjectId(CONSTANTS.IDLE_PAYABLE),
        ObjectId(CONSTANTS.VACATION_PAYABLE)
    ];
    var composeExpensesAndCache = require('../helpers/expenses')(models);
    var JournalEntryHandler = require('./journalEntry');
    var journalEntry = new JournalEntryHandler(models);

    var FilterMapper = require('../helpers/filterMapper');

    this.create = function (req, res, next) {
        var PayRoll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);
        var body = req.body;
        var payRollModel;

        if (!body.month || !body.year) {
            return res.status(400).send();
        }

        body.createdBy = {
            user: req.session.uId,
            date: new Date().toISOString()
        };

        payRollModel = new PayRoll(mapObject(body));

        payRollModel.save(function (err, payRoll) {
            if (err) {
                return next(err);
            }

            res.status(200).send(payRoll);
            composeExpensesAndCache(req);
        });
    };

    this.remove = function (req, res, next) {
        var id = req.params.id;
        var PayRoll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);

        PayRoll.remove({_id: id}, function (err, payRoll) {
            if (err) {
                return next(err);
            }
            res.status(200).send(payRoll);
            composeExpensesAndCache(req);
        });
    };

    this.removeByDataKey = function (req, res, next) {
        var body = req.body;
        var PayRoll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);
        var dataKeys = body && body.dataKeys ? body.dataKeys : null;

        if (!dataKeys) {
            return res.status(400).send();
        }

        if (dataKeys && dataKeys.length) {
            async.each(dataKeys, function (dataKey, cb) {
                PayRoll.remove({dataKey: parseInt(dataKey, 10)}, cb);
            }, function (err) {
                if (err) {
                    return next(err);
                }
            });
        }

        res.status(200).send('Done');
        composeExpensesAndCache(req, function (err) {
            if (err) {
                return next(err);
            }
        });
    };

    this.putchModel = function (req, res, next) {
        var data = mapObject(req.body);
        var id = req.params.id;
        var error;
        var PayRoll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);

        data.editedBy = {
            user: req.session.uId,
            date: new Date().toISOString()
        };

        if (data.type) {
            data.type = ObjectId(data.type);
        }

        PayRoll.findByIdAndUpdate(id, {$set: data}, {new: true}, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'updated'});

            composeExpensesAndCache(req);
        });
    };

    this.patchByDataKey = function (req, res, next) {
        var body = req.body;
        var uId = req.session.uId;
        var PayRoll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);

        var keys = body ? Object.keys(body) : null;

        if (keys.length) {
            async.each(keys, function (key, cb) {
                var data = body[key];

                data.editedBy = {
                    user: uId,
                    date: new Date().toISOString()
                };

                PayRoll.find({dataKey: key}, function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    if (!result.length) {
                        return res.status(400).send();
                    }

                    PayRoll.update({dataKey: key}, {$set: data}, {multi: true, new: true}, cb);
                });

            }, function (err) {
                if (err) {
                    return next(err);
                }
            });
        }

        res.status(200).send({done: 'success'});
        composeExpensesAndCache(req, function (err) {
            /* if (err) {
             return next(err);
             }*/
        });
    };

    this.putchBulk = function (req, res, next) {
        var body = req.body;
        var uId;
        var PayRoll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);

        async.each(body, function (data, cb) {
            var id = data._id;

            data.editedBy = {
                user: uId,
                date: new Date().toISOString()
            };
            delete data._id;

            if (data.type) {
                data.type = ObjectId(data.type);
            }

            PayRoll.findByIdAndUpdate(id, {$set: data}, {new: true}, cb);
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'updated'});

            composeExpensesAndCache(req);
        });
    };

    this.getAsyncData = function (req, res, next) {
        var data = req.query;
        var dataKey = data.dataKey;
        var _id = data._id;
        var sort = {date: -1, 'type.name': -1};
        var PayRoll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);
        var queryObject = {dataKey: parseInt(dataKey, 10), employee: ObjectId(_id)};

        PayRoll.aggregate([{
            $match: queryObject
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'employee',
                foreignField: '_id',
                as          : 'employee'
            }
        }, {
            $lookup: {
                from        : 'journals',
                localField  : 'type',
                foreignField: '_id',
                as          : 'type'
            }
        }, {
            $project: {
                employee: {$arrayElemAt: ['$employee', 0]},
                type    : {$arrayElemAt: ['$type', 0]},
                calc    : 1,
                paid    : 1,
                diff    : 1,
                month   : 1,
                year    : 1,
                dataKey : 1,
                date    : 1
            }
        }, {
            $sort: sort
        }], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    function getByDataKey(req, res, next) {
        var id = req.query.id || req.params.id || req.query.dataKey;
        var data = req.query;
        var error;
        var sort = data.sort || {'employee.name.first': 1, 'employee.name.last': 1};
        var sortKeys = Object.keys(sort);
        var PayRoll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);

        var queryObject = {dataKey: parseInt(id, 10)};
        var query;

        if (data.sort) {
            sort[sortKeys[0]] = parseInt(sort[sortKeys[0]], 10);
        }

        PayRoll.aggregate([{
            $match: {
                dataKey: parseInt(id, 10)
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'employee',
                foreignField: '_id',
                as          : 'employee'
            }
        }, {
            $project: {
                employee: {$arrayElemAt: ['$employee', 0]},
                calc    : 1,
                paid    : 1,
                diff    : 1,
                month   : 1,
                year    : 1,
                dataKey : 1,
                islow   : 1
            }
        }, {
            $sort: sort
        }], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    }

    this.getSorted = function (req, res, next) {
        var data = req.query;
        var db = req.session.lastDb;
        var dataKey = data.dataKey;
        var queryObject = {dataKey: parseInt(dataKey, 10)};
        var sort = data.sort || {employee: 1};
        var sortKeys = Object.keys(sort);
        var Payroll = models.get(db, 'PayRoll', PayRollSchema);

        if (data.sort) {
            sort[sortKeys[0]] = parseInt(sort[sortKeys[0]], 10);
        }

        Payroll.aggregate([{
            $match: queryObject
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'employee',
                foreignField: '_id',
                as          : 'employee'
            }
        }, {
            $project: {
                employee: {$arrayElemAt: ['$employee', 0]},
                calc    : 1,
                paid    : 1,
                diff    : 1,
                month   : 1,
                year    : 1,
                dataKey : 1
            }
        }, {
            $sort: sort
        }], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    function getForView(req, res, next) {

        composeExpensesAndCache(req, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    }

    function getById(req, res, next) {
        var data = req.query;
        var Payroll = models.get(req.session.lastDb, 'PayRoll', PayRollSchema);
        var id = data.id;
        var queryObject = {_id: ObjectId(id)};
        var month = parseInt(data.month, 10);
        var year = parseInt(data.year, 10);
        var date = moment().year(year).month(month - 1).startOf('month');
        var endDate = moment(date).endOf('month');

        endDate = new Date(endDate);

        Payroll.aggregate([{
            $match: queryObject
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'employee',
                foreignField: '_id',
                as          : 'employee'
            }
        }, {
            $project: {
                employee  : {$arrayElemAt: ['$employee', 0]},
                transfer  : 1,
                year      : 1,
                month     : 1,
                dataKey   : 1,
                earnings  : 1,
                deductions: 1,
                paid      : 1,
                diff      : 1,
                tax       : 1,
                taxableIncome:1,
                date      : 1,
                status    : 1
            }
        }, {
            $lookup: {
                from        : 'transfers',
                localField  : 'employee._id',
                foreignField: 'employee',
                as          : 'transfer'
            }
        }, {
            $project: {
                employee: 1,
                transfer: {
                    $filter: {
                        input: '$transfer',
                        as   : 'item',

                        cond: {
                            $lte: ['$$item.date', endDate]
                        }
                    }
                },

                year      : 1,
                month     : 1,
                dataKey   : 1,
                earnings  : 1,
                deductions: 1,
                paid      : 1,
                diff      : 1,
                tax       : 1,
                taxableIncome:1,
                date      : 1,
                status    : 1
            }
        }, {
            $lookup: {
                from        : 'Department',
                localField  : 'employee.department',
                foreignField: '_id',
                as          : 'employee.department'
            }
        }, {
            $project: {
                'employee._id'       : 1,
                'employee.name'      : 1,
                'employee.department': {$arrayElemAt: ['$employee.department', 0]},
                transferDate         : {$max: '$transfer.date'},
                transfer             : 1,
                year                 : 1,
                month                : 1,
                dataKey              : 1,
                earnings             : 1,
                deductions           : 1,
                paid                 : 1,
                tax                  : 1,
                taxableIncome        : 1,
                diff                 : 1,
                date                 : 1,
                status               : 1
            }
        }, {
            $project: {
                'employee._id'       : 1,
                'employee.name'      : 1,
                'employee.department': 1,
                transfer             : 1,
                salary               : {
                    $filter: {
                        input: '$transfer',
                        as   : 'item',

                        cond: {
                            $eq: ['$$item.date', '$transferDate']
                        }
                    }
                },

                year      : 1,
                month     : 1,
                dataKey   : 1,
                earnings  : 1,
                deductions: 1,
                paid      : 1,
                diff      : 1,
                tax       : 1,
                taxableIncome:1,
                date      : 1,
                status    : 1
            }
        }, {
            $project: {
                'employee._id'       : 1,
                'employee.name'      : 1,
                'employee.department': '$employee.department.name',
                salary               : {$max: '$salary.salary'},
                year                 : 1,
                month                : 1,
                dataKey              : 1,
                earnings             : 1,
                deductions           : 1,
                paid                 : 1,
                diff                 : 1,
                tax                  : 1,
                taxableIncome        : 1,
                date                 : 1,
                status               : 1
            }
        }], function (err, result) {
            var employeeId;
            var Vacation;
            var queryObject;
            var month;
            var year;
            var grossPay = 0;
            var totalDeduction = 0;
            // var taxableIncome = 0;
            var insurance = 0;
            var communication = 0;
            var absence = 0;
            var i;
            var earnings;
            var deductions;

            if (err) {
                return next(err);
            }

            Vacation = models.get(req.session.lastDb, 'Vacation', VacationSchema);
            result = result && result.length ? result[0] : {};

            earnings = result.earnings;
            deductions = result.deductions;

            for (i = earnings.length - 1; i >= 0; i--) {
                grossPay += earnings[i].amount;
                // if(earnings[i].formula == '通讯补贴'){
                //     communication = earnings[i].amount;
                // }
            }

            for (i = deductions.length - 1; i >= 0; i--) {
                totalDeduction += deductions[i].amount;
                // if(deductions[i].formula == '缺勤扣款'){
                //     absence = deductions[i].amount;
                // }
                // if(deductions[i].formula == '养老保险')
                // {
                //     insurance += deductions[i].amount;
                // }
                // if(deductions[i].formula == '失业保险')
                // {
                //     insurance += deductions[i].amount;
                // }
                // if(deductions[i].formula == '住房公积金')
                // {
                //     insurance += deductions[i].amount;
                // }
                // if(deductions[i].formula == '医疗保险')
                // {
                //     insurance += deductions[i].amount;
                // }
            }

            result.grossPay = grossPay;
            result.totalDeduction = totalDeduction;

            // taxableIncome = grossPay - communication - insurance - absence;
            // result.taxableIncome = taxableIncome;

            employeeId = result.employee._id;
            month = result.month;
            year = result.year;

            queryObject = {employee: ObjectId(employeeId), month: month, year: year};

            Vacation.aggregate([{
                $match: queryObject
            }, {
                $unwind: '$vacArray'
            }, {
                $group: {_id: '$vacArray', sum: {$sum: 1}}
            }], function (err, resultVacArray) {
                var obj = {};
                if (err) {
                    return next(err);
                }

                resultVacArray.forEach(function (el) {
                    if (el._id !== null) {
                        obj[el._id] = el.sum;
                    }
                });

                result.vacArray = obj;

                res.status(200).send(result);
            });
        });
    }

    this.getForView = function (req, res, next) {
        var query = req.query;
        var id = req.params.id;
        var sort = query.sort || {};
        console.log(id);
        console.log(query);
        if (Object.keys(sort).length) {
            return getByDataKey(req, res, next);
        }

        if (query.id || id) {
            if (query.id && (query.id.length >= 24)) {
                getById(req, res, next);
            } else {
                getByDataKey(req, res, next);
            }
        } else {
            getForView(req, res, next);
        }
    };


    function salaryReport2(req,cb){
        var db = req.session.lastDb;
        var Employee = models.get(db, 'Employees', EmployeeSchema);
        var Payroll = models.get(db, 'PayRoll', PayRollSchema);
        var query = req.query;
        var filter = query.filter || {};

        var paginationObject = pageHelper(query);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var date = filter&&filter.startDate ? new Date(filter.startDate.value) : new Date();
        var key = 'salaryReport' + filter + date.toString();
        var redisStore = require('../helpers/redisClient');
        var dataKey = moment(date).year()*100 + (moment(date).month() + 1);
        var type = query.type || 'A';
        var filterMapper = new FilterMapper();
        var payrollResult = [];

        var department;
        var matchDepartment = {};
        if (filter.department && typeof filter === 'object') {
            department = filter.department.value[0];

            delete filter.department;
            matchDepartment = {department: ObjectId(department)};
        }
        function checkFilter(callback) {
            callback(null, filter);
        }

        function getEmployees(filter, callback){
            var matchObj;

            matchObj = {
                $and: [{
                    $or: [{
                        $and: [{
                            isEmployee: true,
                            'department.externalId': type
                        }, /* { // commented in case of employee that was fired and again hired
                         $or: [{
                         lastFire: null
                         }, {
                         lastFire: {
                         $ne : null,
                         $gte: startDateKey
                         }
                         }]
                         },*/
                            {
                                firstHire: {
                                    $ne : null,
                                    $lte: dataKey
                                }
                            }]
                    }, {
                        $and: [{
                            isEmployee: false,
                            'department.externalId': type
                        }, {
                            lastFire: {
                                $ne : null,
                                $gte: dataKey
                            }
                        }, {
                            firstHire: {
                                $ne : null,
                                $lte: dataKey
                            }
                        }]
                    }
                    ]
                }]
            };

            if (filter && typeof filter === 'object') {
                /*filterValue = caseFilterEmployee(filter);
                 if (filterValue.length) {*/
                // matchObj.$and.push({$and: caseFilterEmployee(filter)});

                delete filter.startDate;
                //delete filter.department;
                matchObj.$and.push(filterMapper.mapFilter(filter, 'salaryReport'));

                // }
            }


            Employee.aggregate([
                {
                    $match: {
                            hire: {$ne: []}
                        }
                    }, {
                            $lookup: {
                                from        : 'Department',
                                localField  : 'department',
                                foreignField: '_id',
                                as          : 'department'
                        }
                    }, 
                    {
                            $project: {
                                department: {$arrayElemAt: ['$department', 0]},
                                isEmployee: 1,
                                name      : 1,
                                hire      : 1,
                                firstHire : {
                                    $let: {
                                        vars: {
                                            firstHired: {$arrayElemAt: ['$hire', 0]}
                                        },

                                        in: {$ifNull: [{$add: [{$multiply: [{$year: '$$firstHired'}, 100]},{$month: '$$firstHired'}]},0]}
                                    }
                                }
                            }
                    },
                    {
                        $match: matchObj
                    },
                    {
                        $group:{
                            _id: null,
                            total: {$sum: 1},
                            root: {$push: '$$ROOT'},
                            hire: {$push: '$hire'}
                        }
                    },{
                       $unwind: '$root' 
                    },
                    {
                        $project:{
                            _id: '$root._id',
                            name: '$root.name',
                            deparment: '$root.department',
                            hire : 1,
                            total: 1
                        }
                    }
                ],function(err, result){
                    if(err){
                        callback(err);
                    }
                    callback(null, result);
                });


        }

        function getPayroll(employeesResult, callback){
            async.map(employeesResult, function (empObject, asyncCb) {
                var employeeId = ObjectId(empObject._id);
                Payroll.aggregate([
                        {
                            $match: {
                                employee: employeeId,
                                dataKey : dataKey,
                            }
                        },
                        {
                            $match: matchDepartment
                        },
                        {
                            $lookup: {
                                    from        : 'Employees',
                                    localField  : 'employee',
                                    foreignField: '_id',
                                    as          : 'employee'
                                }
                        },
                        {
                            $lookup: {
                                from        : 'Department',
                                localField  : 'department',
                                foreignField: '_id',
                                as          : 'department'
                            }
                        },
                        {
                            $project: {
                                employee: {$arrayElemAt: ['$employee', 0]},
                                calc: 1,
                                taxableIncome: 1,
                                tax: 1,
                                deductions: 1,
                                earnings: 1,
                                department: {$arrayElemAt: ['$department', 0]}
                            }
                        },
                        {
                            $skip: skip
                        }, {
                            $limit: limit
                        }
                        ],function(err, result){
                        if(err){
                            callback(err);
                        }

                        asyncCb(null,result);                        
                    });
            }, function(err, payrollResult){
                if(err){
                    return asyncCb(err);
                }
                var response = {};
                response.data = _.flatten(payrollResult, true);
                response.data.sort(function(a, b){
                    return b.calc - a.calc;
                });
                response.total = response.data.length;
                callback(null, response);
            });
        }

        async.waterfall([checkFilter, getEmployees, getPayroll], function (err, result) {
            if(err){
                cb(err);
            }
            var count;
            var response = {};
            count = result.total;
            response.total = count;
            response.data = result.data;
            cb(null, response);
        });

    }

    function salaryReport(req, cb) {
        var date = new Date();
        var db = req.session.lastDb;
        var Employee = models.get(db, 'Employees', EmployeeSchema);
        var query = req.query;
        var filter = query.filter || {};
        var startDate = new Date(query.startDate);
        var endDate = new Date(query.endDate);
        var key = 'salaryReport' + filter + startDate.toString() + endDate.toString();
        var redisStore = require('../helpers/redisClient');
        var waterfallTasks;
        var startDateKey = moment(startDate).year() * 100 + moment(startDate).week(); // todo isoWeek (changed on week)
        var endDateKey = moment(endDate).year() * 100 + moment(endDate).week(); // todo isoWeek (changed on week)
        // var filterValue;
        var filterMapper = new FilterMapper();

        /*function caseFilterEmployee(filter) {
         var condition;
         var resArray = [];
         var filtrElement = {};
         var filterName;
         var keyCase;
         var i;
         var filterNameKeys = Object.keys(filter);

         for (i = filterNameKeys.length - 1; i >= 0; i--) {
         filterName = filterNameKeys[i];
         condition = filter[filterName].value;
         keyCase = filter[filterName].key;

         switch (filterName) {
         case 'employee':
         filtrElement[keyCase] = {$in: condition.objectID()};
         resArray.push(filtrElement);
         break;
         case 'department':
         filtrElement[keyCase] = {$in: condition.objectID()};
         resArray.push(filtrElement);
         break;
         case 'onlyEmployees':
         resArray.push({isEmployee: true});
         break;
         // skip default;
         }
         }

         return resArray;
         }*/

        function checkFilter(callback) {
            callback(null, filter);
        }

        function getResult(filter, callback) {
            var matchObj;

            matchObj = {
                $and: [{
                    $or: [{
                        $and: [{
                            isEmployee: true,
                        }, /* { // commented in case of employee that was fired and again hired
                         $or: [{
                         lastFire: null
                         }, {
                         lastFire: {
                         $ne : null,
                         $gte: startDateKey
                         }
                         }]
                         },*/
                            {
                                firstHire: {
                                    $ne : null,
                                    $lte: endDateKey
                                }
                            }]
                    }, {
                        $and: [{
                            isEmployee: false
                        }, {
                            lastFire: {
                                $ne : null,
                                $gte: startDateKey
                            }
                        }, {
                            firstHire: {
                                $ne : null,
                                $lte: endDateKey
                            }
                        }]
                    }
                    ]
                }]
            };

            if (filter && typeof filter === 'object') {
                /*filterValue = caseFilterEmployee(filter);
                 if (filterValue.length) {*/
                // matchObj.$and.push({$and: caseFilterEmployee(filter)});

                delete filter.startDate;
                delete filter.endDate;

                matchObj.$and.push(filterMapper.mapFilter(filter, 'salaryReport'));
                // }
            }

            Employee
                .aggregate([{
                    $lookup: {
                        from        : 'Department',
                        localField  : 'department',
                        foreignField: '_id',
                        as          : 'department'
                    }
                }, {
                    $lookup: {
                        from        : 'transfers',
                        localField  : '_id',
                        foreignField: 'employee',
                        as          : 'transfer'
                    }
                }, {
                    $project: {
                        department: {$arrayElemAt: ['$department', 0]},
                        isEmployee: 1,
                        name      : 1,
                        lastFire  : 1,
                        transfer  : 1,
                        firstHire : {
                            $let: {
                                vars: {
                                    firstHired: {$arrayElemAt: ['$hire', 0]}
                                },

                                in: {$add: [{$multiply: [{$year: '$$firstHired'}, 100]}, {$week: '$$firstHired'}]}
                            }
                        }
                    }
                }, {
                    $match: matchObj
                }, {
                    $unwind: '$transfer'
                }, {
                    $match: {
                        'transfer.status': {$ne: 'fired'}
                    }
                }, {
                    $project: {
                        isEmployee: 1,
                        department: 1,
                        transfer  : 1,
                        name      : 1,
                        lastFire  : 1,
                        year      : {$year: '$transfer.date'}
                    }
                    /* }, {
                     $match: {
                     'year': {$lt: year + 1}
                     }*/
                }, {
                    $project: {
                        isEmployee: 1,
                        department: 1,
                        transfer  : 1,
                        name      : 1,
                        month     : {$add: [{$month: '$transfer.date'}, 1]},
                        year      : 1,
                        lastFire  : 1,
                        hireDate  : {$add: [{$multiply: [{$year: '$transfer.date'}, 100]}, {$month: '$transfer.date'}, 1]}
                    }
                }, {
                    $group: {
                        _id       : '$_id',
                        department: {$addToSet: '$department'},
                        name      : {$addToSet: '$name'},
                        transfer  : {$push: '$$ROOT'},
                        lastFire  : {$addToSet: '$lastFire'}
                    }
                }, {
                    $project: {
                        _id       : 1,
                        department: {$arrayElemAt: ['$department', 0]},
                        name      : {$arrayElemAt: ['$name', 0]},
                        transfer  : 1,
                        lastFire  : {$arrayElemAt: ['$lastFire', 0]}
                    }
                }, {
                    $project: {
                        _id       : 1,
                        department: '$department.name',
                        name      : {$concat: ['$name.first', ' ', '$name.last']},
                        transfer  : 1,
                        lastFire  : 1
                    }
                }, {
                    $sort: {
                        department: 1,
                        name      : 1
                    }
                }], function (err, result) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, result);
                });
        }

        waterfallTasks = [checkFilter, getResult];

        async.waterfall(waterfallTasks, function (err, result) {
            redisStore.writeToStorage('salaryReport', key, JSON.stringify(result));

            if (cb && typeof cb === 'function') {
                if (err) {
                    return cb(err);
                }

                cb(null, result);
            }
        });
    }

    this.getSalaryReport = function (req, res, next) {

        salaryReport2(req, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.composeSalaryReport = function (req, cb) {
        salaryReport(req, cb);
    };

    function generate(req, res, next, cbFromRecalc) {
        var db = req.session.lastDb;
        var Employee = models.get(db, 'Employees', EmployeeSchema);
        var Payroll = models.get(db, 'PayRoll', PayRollSchema);
        var PayrollComponentType = models.get(db, 'payrollComponentType', PayrollComponentTypeSchema);
        var JournalEntry = models.get(req.session.lastDb, 'journalEntry', journalEntrySchema);
        var PersonExternal = models.get(req.session.lastDb, 'personExternal', personExternalSchema);
        var PersonDeduction = models.get(req.session.lastDb, 'personDeduction', personDeductionSchema);
        var socialInsurance = models.get(req.session.lastDb, 'socialInsurance', socialInsuranceSchema);
        var attendanceModel = models.get(req.session.lastDb, 'attendance', attendanceSchema);
        var timeCard = models.get(req.session.lastDb, 'timeCard', tcardSchema);
        var holiday = models.get(req.session.lastDb, 'Holiday', holidaySchema);
        var Tax = models.get(req.session.lastDb, 'tax', taxSchema);
        var TaxFree = models.get(req.session.lastDb, 'taxFree', taxFreeSchema);
        var MinimumWage = models.get(req.session.lastDb, 'minimumWage', minimumWageSchema);
        var data = req.body;
        var month = parseInt(data.month, 10);
        var year = parseInt(data.year, 10);
        var dataKey = year * 100 + month;
        console.log(dataKey);
        var waterfallTasks;
        var employees;
        var ids = {};
        var i;
        var date = moment().year(year).month(month - 1).startOf('month');
        var endDate = moment(date).endOf('month');
        var employeesIds = [];
        var employeeQueryForEmployeeByDep;
        var startDateKey = date.isoWeekYear() * 100 + date.isoWeek();
        var endDateKey = endDate.isoWeekYear() * 100 + endDate.isoWeek();
        var localDate = new Date(moment().isoWeekYear(year).month(month - 1).endOf('month').set({
            hour       : 15,
            minute     : 1,
            second     : 0,
            millisecond: 0
        }));
        var parameters = {};

        /* if (endDateKey < startDateKey){
         endDateKey = (endDate.year() + 1) * 100 + endDate.isoWeek();
         }*/

        date = new Date(date);
        endDate = new Date(endDate);

        if (!data.month || !data.year) {
            return res.status(400).send();
        }

        employeeQueryForEmployeeByDep = {
            $and: [{
                $or: [{
                    $and: [{
                        isEmployee: true,
                        'department.externalId': 'A'
                    }, {
                        $or: [{
                            lastFire: null,
                            lastHire: {
                                $ne : null,
                                $lte: endDateKey
                            }
                        }, {
                            lastFire: {
                                $ne : null,
                                $gte: startDateKey
                            }
                        }, {
                            lastHire: {
                                $ne : null,
                                $lte: endDateKey
                            }
                        }]
                    }]
                }, {
                    $and: [{
                        isEmployee: false,
                        'department.externalId': 'A'
                    }, {
                        lastFire: {
                            $ne : null,
                            $gte: startDateKey
                        }
                    }, {
                        lastHire: {
                            $ne : null,
                            $lte: endDateKey
                        }
                    }]
                }]
            }]
        };

        function countTimeCard(mainCb){
            timeCard.count({year: year, month:month}, function(err, count){
                if(err){
                    mainCb(err)
                }
                if(count == 0){
                    var error = new Error('考勤还未导入');
                    error.status = 500;
                    mainCb(error);
                }
                else{
                    mainCb(null, null);
                }
            })
        }

        function countSocialInsurance(timeCard, mainCb){
            socialInsurance.count({year: year, month: month}, function(err, count){
                if(err){
                    mainCb(err)
                }
                if(count == 0){
                    var error = new Error('社保还未导入');
                    error.status = 500;
                    mainCb(error);
                }
                else{
                    mainCb(null, null);
                }
            })
        }

        function getTax(socialInsurance, mainCb){
            Tax.aggregate([
                {
                    $project: {
                        level: 1,
                        high : 1,
                        low  : 1,
                        rate : 1,
                        countDeduction : 1
                    }
                }],function(err, result){
                    if(err){
                        mainCb(err);
                    }
                    if(result.length == 0){
                        var error = new Error('税表还未设置');
                        error.status = 500;
                        mainCb(error);
                    }
                    else{
                        parameters.tax = result;
                        mainCb(null, result);
                    }
                })
        }

        function getTaxFree(tax, mainCb){
             TaxFree.aggregate([
                    {
                        $project: {
                            deductible : 1,
                            base       : 1
                        }
                    }
                ],function(err, result){
                    if(err){
                        mainCb(err);
                    }
                    if(result.length == 0){
                        var error = new Error('收税基数与可抵扣字段未设置');
                        error.status = 500;
                        mainCb(error);
                    }
                    else{
                        parameters.taxFree = result[0];
                        mainCb(null,result[0]);
                    }
                })
        }

        function getMinimumWage(taxFree, mainCb){
            MinimumWage.aggregate([
                    {
                        $project: {
                            wage: 1,
                            communication: 1
                        }
                    }
                ],function(err, result){
                    if(err){
                        mainCb(err);
                    }
                    if(taxFree.length == 0){
                        var error = new Error('最低工资标准与通讯补贴未设置');
                        error.status = 500;
                        mainCb(error);
                    }
                    else{
                        parameters.minimumWage = result[0];
                        mainCb(null,result[0]);
                    }
                })
        }

        function getEmployees(minimumWage, mainCb) {
            Employee.aggregate([{
                $match: {
                    hire: {$ne: []}
                }
            }, {
                $lookup: {
                    from        : 'transfers',
                    localField  : '_id',
                    foreignField: 'employee',
                    as          : 'transfer'
                }
            },{
                $lookup: {
                    from: 'Department',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'department'
                }
            },{
                $project: {
                    isEmployee  : 1,
                    name        : {$concat: ['$name.first', ' ', '$name.last']},
                    fire        : 1,
                    hire        : 1,
                    lastFire    : 1,
                    transfer    : 1,
                    identNo     : 1,
                    lastTransfer: {$max: '$transfer.date'},
                    hireCount   : {$size: '$hire'},
                    lastHire    : {
                        $let: {
                            vars: {
                                lastHired: {$arrayElemAt: [{$slice: ['$hire', -1]}, 0]}
                            },

                            in: {$add: [{$multiply: [{$year: '$$lastHired'}, 100]}, {$week: '$$lastHired'}]}
                        }
                    },
                    department: {$arrayElemAt: ['$department', 0]}
                }
            }, {
                $match: employeeQueryForEmployeeByDep
            }, {
                $project: {
                    transfer: {
                        $filter: {
                            input: '$transfer',
                            as   : 'item',

                            cond: {
                                $lte: ['$$item.date', endDate]
                            }
                        }
                    },
                    identNo: 1,
                    name: 1,
                    fire: 1,
                    hire: '$transfer'
                }
            }, {
                $project: {
                    transferDate: {$max: '$transfer.date'},
                    transfer    : 1,
                    name        : 1,
                    fire        : 1,
                    hire        : 1,
                    identNo     : 1
                }
            },{
                $project: {
                    transferDate: 1,
                    transferDateKey : { 
                        $cond: [
                            { 
                                $ifNull: ['$transferDate', 0] 
                            }, 
                            {
                                $add: [{$multiply: [{$year: '$transferDate'}, 100]}, {$month: '$transferDate'}]
                            }, -1] 
                    },
                    transfer    : 1,
                    name        : 1,
                    fire        : 1,
                    hire        : 1,
                    identNo     : 1
                }
            }, {
                $project: {
                    transfer: {
                        $filter: {
                            input: '$hire',
                            as   : 'item',
                            cond: {
                                $eq: [{$add: [{$multiply: [{$year: '$$item.date'}, 100]}, {$month: '$$item.date'}]},'$transferDateKey']
                            }
                        }
                    },
                    salary: {
                        $filter: {
                            input: '$transfer',
                            as   : 'item',

                            cond: {
                                $eq: ['$$item.date', '$transferDate']
                            }
                        }
                    },
                    transferDate: 1,
                    transferDateKey : 1,
                    name: 1,
                    fire: 1,
                    hire: 1,
                    identNo: 1
                }
            }, {
                $project: {
                    salary              : {$max: '$salary.salary'},
                    transfer            : 1,
                    transferDate        : 1,
                    transferDateKey     : 1,
                    payrollStructureType: {$arrayElemAt: ['$salary', 0]},
                    fire                : 1,
                    name                : 1,
                    hire                : 1,
                    identNo             : 1
                }
            },
            {
                $project: {
                    department          : '$payrollStructureType.department',
                    salary              : 1,
                    transfer            : 1,
                    transferDate: 1,
                    transferDateKey     : 1,
                    name                : 1,
                    payrollStructureType: '$payrollStructureType.payrollStructureType',
                    fire                : 1,
                    hire                : 1,
                    identNo             : 1
                }
            }, {
                $lookup: {
                    from        : 'payrollStructureTypes',
                    localField  : 'payrollStructureType',
                    foreignField: '_id',
                    as          : 'payrollStructureType'
                }
            }, {
                $project: {
                    name                : 1,
                    department          : 1,
                    salary              : 1,
                    transferDate        : 1,
                    transferDateKey     : 1,
                    transfer            : 1,
                    fire                : 1,
                    hire                : 1,
                    payrollStructureType: {$arrayElemAt: ['$payrollStructureType', 0]},
                    identNo             : 1
                }
            }
            ], function (err, result) {
                if (err) {
                    return mainCb(err);
                }console.log(result);
                mainCb(null, result);
            });
        }

        function generatePayroll(employeesResult, mainCb) {
            async.each(employeesResult, function (empObject, asyncCb) {
                var employee = empObject._id;
                var employeeName = empObject.name;
                var department = empObject.department;
                var identNo = empObject.identNo;
                var salary = empObject.salary;
                var hire = empObject.hire;
                var fire = empObject.fire;
                var dateToCreate = endDate;
                var hireKey = moment(new Date(hire[0].date)).year() * 100 + moment(new Date(hire[0].date)).month() + 1;
                var fireKey = fire[0] ? moment(new Date(fire[0])).year() * 100 + moment(new Date(fire[0])).month() + 1 : Infinity;
                var localKey = moment(dateToCreate).year() * 100 + moment(dateToCreate).month() + 1;
                var payrollStructureType = empObject.payrollStructureType || {};
                var earnings = payrollStructureType.earnings || [];
                var deductions = payrollStructureType.deductions || [];
                var parallelTasks;
                var parallelFunctionsObject = {};
                var newPayrollModel;
                var parallelObject = {};
                var payrollBody = {};
                var bodySalary;
                var journal = CONSTANTS.ADMIN_SALARY_JOURNAL;
                var createJE = false;
                var islow = false;
                var daysInMonth;
                var payForDay;
                var removeJournalEntries;
                var createJournalEntries;
                var populateTax;
                var populateTaxFree;
                var taxableIncome;
                var otherArray = [];
                var otherCount = -1;
                var anotherArray = [];
                var anotherCount = -1;
                var transfer = empObject.transfer;
                var transferDateKey = empObject.transferDateKey;
                if(transfer.length > 1 && transferDateKey != year*100 + month){
                    salary = transfer[1].salary;
                }
                else if(transfer.length == 0){
                    salary = 0;
                }
                else{
                    salary = transfer[0].salary;
                }

                if (hireKey === localKey) {
                    daysInMonth = moment(dateToCreate).endOf('month').date();
                    payForDay = salary / daysInMonth;

                    salary = payForDay * (daysInMonth - moment(new Date(hire[0].date)).date() + 1);
                }

                if (fireKey === localKey) {
                    daysInMonth = moment(dateToCreate).endOf('month').date();
                    payForDay = salary / daysInMonth;

                    salary = payForDay * moment(new Date(fire[0])).date();
                } else if (fireKey < localKey) {
                    salary = 0;
                }
                console.log(salary);
                payrollBody.employee = employee;
                payrollBody.month = month;
                payrollBody.year = year;
                payrollBody.dataKey = dataKey;

                bodySalary = {
                    currency      : CONSTANTS.CURRENCY_USD,
                    journal       : journal,
                    date          : localDate,
                    sourceDocument: {
                        model: 'Employees',
                        _id  : employee,
                        name : employeeName
                    }
                };

                function vacation(pcb) {
                    JournalEntry.aggregate([{
                        $match: {
                            ' ._id'  : employee,
                            'sourceDocument.model': 'Employees',
                            journal               : ObjectId(CONSTANTS.VACATION_PAYABLE),
                            date                  : {
                                $gte: date,
                                $lte: endDate
                            }
                        }
                    }, {
                        $group: {
                            _id   : '$sourceDocument._id',
                            debit : {$sum: '$debit'},
                            credit: {$sum: '$credit'}
                        }
                    }], function (err, result) {
                        var resultItem;

                        if (err) {
                            return pcb(err);
                        }

                        resultItem = result && result.length ? result[0] : {};

                        pcb(null, resultItem.debit || resultItem.credit || 0);
                    });
                }

                function overtime(pcb) {
                    var newOsalary = salary - parameters.minimumWage.communication/100;
                    if(newOsalary < parameters.taxFree.base){
                        if(newOsalary*0.6 > parameters.minimumWage.wage){
                            pcb(null, newOsalary * 0.4 * 100);
                        }
                        else if(newOsalary*0.6 < parameters.minimumWage.wage && newOsalary > parameters.minimumWage.wage){
                            pcb(null, (newOsalary - parameters.minimumWage.wage)*100);
                        }
                        else if(newOsalary < parameters.minimumWage.wage){
                            pcb(null, 0);
                        }
                    }
                    else{
                        pcb(null, newOsalary * 0.4 * 100);
                    }
                }

                function base(pcb) {
                    var newSalary = (salary - parameters.minimumWage.communication/100);
                    if(newSalary < parameters.taxFree.base){
                        if(newSalary*0.6 > parameters.minimumWage.wage){
                            pcb(null, newSalary * 0.6 * 100);
                            createJE = true;
                        }
                        else if(newSalary*0.6 <= parameters.minimumWage.wage && newSalary > parameters.minimumWage.wage){
                            pcb(null, parameters.minimumWage.wage*100);
                            createJE = true;
                        }
                        else if(newSalary <= parameters.minimumWage.wage){
                            islow = true;
                            pcb(null, newSalary*100);
                        }
                    }
                    else{
                        pcb(null, newSalary * 0.6 * 100);
                        createJE = true;
                    }   
                }

                function housingAdd(pcb){
                    PersonExternal.aggregate([
                            {
                                $match: {
                                    employee : employee,
                                    allowanceName: '住房补贴'
                                }
                            },{
                                $project: {
                                    amount: 1
                                }
                            }
                        ],function(err, result){
                            var resultItem;
                            if(err){
                                return pcb(err);
                            }

                            resultItem = result && result.length ? result[0] : {};

                            pcb(null, resultItem.amount||0);

                        });
                }

                function communication(pcb){
                    pcb(null,parameters.minimumWage.communication*100 || 0);
                }

                function meal(pcb){
                    PersonExternal.aggregate([
                            {
                                $match: {
                                    employee : employee,
                                    allowanceName: '餐费补贴'
                                }
                            },{
                                $project: {
                                    amount: 1
                                }
                            }
                        ],function(err, result){
                            var resultItem;
                            if(err){
                                return pcb(err);
                            }

                            resultItem = result && result.length ? result[0] : {};

                            pcb(null, resultItem.amount||0);

                        });
                }

                function jobTitle(pcb){
                    PersonExternal.aggregate([
                            {
                                $match: {
                                    employee : employee,
                                    allowanceName: '职称补贴'
                                }
                            },{
                                $project: {
                                    amount: 1
                                }
                            }
                        ],function(err, result){
                            var resultItem;
                            if(err){
                                return pcb(err);
                            }

                            resultItem = result && result.length ? result[0] : {};

                            pcb(null, resultItem.amount||0);

                        });
                }

                function absence(pcb){
                    attendanceModel.aggregate([
                        {
                            $match: {
                                employee: employee,
                                year: year,
                                month: month
                            }
                        },
                        {
                            $project: {
                                late: 1,
                                early: 1
                            }
                        }
                    ],function(err, result){
                        if(err){
                            return pcb(err);
                        }
                        if(result[0]){
                            var late = result[0].late? result[0].late: 0;
                            var early = result[0].early? result[0].early: 0;
                            var amount = (late+early)*10;
                            pcb(null, amount*100||0);
                        }
                        else{
                            pcb(null, 0);
                        }
                        
                    })
                }
                function endowmentInsurance(pcb){
                    socialInsurance.aggregate([
                        {
                            $match: {
                                employee: employee,
                                year    : year,
                                month   : month,
                            }
                        },{
                            $project: {
                                endowmentInd: 1
                            }
                        }
                    ], function(err, result){
                        var resultItem;
                            if(err){
                                return pcb(err);
                            }

                            resultItem = result && result.length ? result[0] : {};

                            pcb(null, resultItem.endowmentInd*100||0);
                    });

                }
                function unemploymentInsurance(pcb){
                    socialInsurance.aggregate([
                        {
                            $match: {
                                employee: employee,
                                year    : year,
                                month   : month
                            }
                        },{
                            $project: {
                                unemployeeInd: 1
                            }
                        }
                    ],function(err, result){
                        var resultItem;
                        if(err){
                            return pcb(err);
                        }

                        resultItem = result && result.length ? result[0] : {};

                        pcb(null, resultItem.unemployeeInd*100||0);
                    });
                }
                function medicalInsurance(pcb){
                    socialInsurance.aggregate([
                        {
                            $match: {
                                employee: employee,
                                year: year,
                                month: month
                            }
                        },{
                            $project: {
                                medicalInd: 1
                            }
                        }
                    ],function(err, result){
                        var resultItem;
                        if(err){
                            return pcb(err);
                        }

                        resultItem = result && result.length ? result[0] : {};

                        pcb(null, resultItem.medicalInd*100||0);
                    });
                }
                function cityHealth(pcb){
                    socialInsurance.aggregate([
                        {
                            $match: {
                                employee: employee,
                                year: year,
                                month: month
                            }
                        },
                        {
                            $project: {
                                cityHealth: 1
                            }
                        }
                    ], function(err, result) {
                        var resultItem;
                        if(err){
                            return pcb(err);
                        }

                        resultItem = result && result.length? result[0]: {};

                        pcb(null, resultItem.cityHealth*100||0);
                    });
                }
                function housingFund(pcb){
                    PersonDeduction.aggregate([
                            {
                                $match: {
                                    employee : employee,
                                    year:  year,
                                    month: month,
                                    deductionName: '住房公积金'
                                }
                            },{
                                $project: {
                                    amount: 1
                                }
                            }
                        ],function(err, result){
                            var resultItem;
                            if(err){
                                return pcb(err);
                            }

                            resultItem = result && result.length ? result[0] : {};

                            pcb(null, resultItem.amount||0);

                        });
                }
                function attendance(pcb){
                    timeCard.aggregate([
                        {
                            $match: {
                                year: year,
                                month: month,
                                employee: employee
                            }
                        },
                        {
                            $lookup: {
                                from: 'Department',
                                localField: 'department',
                                foreignField: '_id',
                                as: 'department'
                            }
                        },
                        {
                            $project: {
                                department: {$arrayElemAt: ['$department', 0]},
                                rate: 1
                            }
                        },
                        {
                            $project: {
                                type: '$department.externalId',
                                rate: 1
                            }
                        }
                    ],function(err, result){
                        if(err){
                            pcb(err);
                        }
                        var type = result[0]?result[0].type :'A';
                        var tot = 0;
                        for(var i=0; i<result.length; i++){
                            if(result[i].rate<=1){
                                tot += result[i].rate; 
                            }
                        }
                        holiday.aggregate([
                            {
                                $project: {
                                    date: 1,
                                    dateByMonth: 1,
                                    type: 1
                                }
                            },
                            {
                                $match: {
                                    dateByMonth: dataKey,
                                    type: type
                                }
                            }
                        ], function(err, result){
                            if(err){
                                pcb(err);
                            }
  
                            var day = new Date(year, month, 0);
                            var dayCount = day.getDate();
                            var invalidDay = result.length;
                            console.log(invalidDay, tot);
                            var resultItem = salary * ((dayCount - invalidDay - tot)/(dayCount - invalidDay));
                            pcb(null, resultItem*100||0);
                        })
                    })
                }
                function other(pcb){
                    PersonDeduction.aggregate([
                            {
                                $match: {
                                    employee : employee,
                                    year:  year,
                                    month: month,
                                    deductionName: '其他扣款'
                                }
                            },{
                                $group: {
                                    _id: '$employee',
                                    amount: {$sum: '$amount'},
                                    comments: {$push: '$comment'}
                                }
                            }
                        ],function(err, result){
                            var resultItem;
                            if(err){
                                return pcb(err);
                            }

                            resultItem = result && result.length ? result[0] : {};

                            pcb(null, resultItem.amount||0);

                        });
                }

                function getEarning(pcb){  
                    otherCount = otherCount + 1;
                    PersonExternal.aggregate([
                        {
                            $match:{
                                employee: employee,
                                allowanceName: otherArray[otherCount]
                            }
                        },{
                            $project:{
                                amount: 1
                            }
                        }
                    ],function(err,result){
                        var resultItem;
                        if(err){
                            return pcb(err);
                        }

                        resultItem = result && result.length ? result[0] : {};

                        pcb(null, resultItem.amount||0);
                    });
                    

                }

                function getDeduction(pcb){
                    anotherCount = anotherCount + 1;
                    PersonDeduction.aggregate([
                        {
                            $match:{
                                employee: employee,
                                deductionName: anotherArray[anotherCount]
                            }
                        },{
                            $project:{
                                amount: 1
                            }
                        }
                    ],function(err,result){
                        var resultItem;
                        if(err){
                            return pcb(err);
                        }

                        resultItem = result && result.length ? result[0] : {};

                        pcb(null, resultItem.amount||0);
                    });
                }

                function populateEarnings(pCb) {
                    PayrollComponentType.populate(payrollStructureType, {
                        path: 'earnings',
                        lean: true
                    }, function (err) {
                        if (err) {
                            return pCb(err);
                        }

                        pCb();
                    });
                }

                function populateDeductions(pCb) {
                    PayrollComponentType.populate(payrollStructureType, {
                        path: 'deductions',
                        lean: true
                    }, function (err) {
                        if (err) {
                            return pCb(err);
                        }

                        pCb();
                    });
                }

                
                function getNamesFromFormula(earnings, deductions) {
                    var resultObject = {};
                    var formulasArray = _.union(earnings, deductions);
                    var array = [];
                    var groupedResult;

                    formulasArray.forEach(function (el) {
                        array = _.union(array, el.formula);
                    });

                    groupedResult = _.groupBy(array, 'operand');

                    groupedResult = Object.keys(groupedResult);
                    groupedResult.forEach(function (key) {
                        resultObject[key] = parallelObject[key];
                    });

                    return resultObject;
                }

                function getResultFormula(array, result) {
                    var resultArray = [];
                    var restResultArray = [];
                    array.forEach(function (formulaEl) {
                        var formula = formulaEl.formula;
                        var maxRange = formulaEl.maxRange;
                        var minRange = formulaEl.minRange;
                        var totalSum = 0;

                        formula.forEach(function (formulaElem) {
                            var resultSum = 0;
                            var resultObject = {};
                            var operand = formulaElem.operand;
                            var operation = formulaElem.operation;
                            var ratio = formulaElem.ratio;

                            switch (operation) {
                                case 'multiply':
                                    resultSum += result[operand] * parseFloat(ratio);
                                    break;
                                case 'add':
                                    resultSum += result[operand] + parseFloat(ratio);
                                    break;
                                case 'divide':
                                    resultSum += result[operand] / parseFloat(ratio);
                                    break;
                                case 'subtract':
                                    resultSum += result[operand] - parseFloat(ratio);
                                    break;
                                // skip default;
                            }

                            totalSum += resultSum / 100;

                            resultObject.amount = resultSum / 100;
                            switch(operand){
                                case 'overtime':
                                    resultObject.formula = '加班工资'
                                    break;
                                case 'jobTitle':
                                    resultObject.formula = '职称补贴'
                                    break;
                                case 'meal':
                                    resultObject.formula = '餐费补贴'
                                    break;
                                case 'base':
                                    resultObject.formula = '基本工资'
                                    break;
                                case 'housingAdd':
                                    resultObject.formula = '住房补贴'
                                    break;
                                case 'vacation':
                                    resultObject.formula = '假期工资'
                                    break;
                                case 'communication':
                                    resultObject.formula = '通讯补贴'
                                    break;
                                case 'absence':
                                    resultObject.formula = '考勤扣款'
                                    break;
                                case 'endowmentInsurance':
                                    resultObject.formula = '养老保险'
                                    break;
                                case 'unemploymentInsurance':
                                    resultObject.formula = '失业保险'
                                    break;
                                case 'medicalInsurance':
                                    resultObject.formula = '医疗保险'
                                    break;
                                case 'cityHealth':
                                    resultObject.formula = '市医疗保险'
                                    break;
                                case 'housingFund':
                                    resultObject.formula = '住房公积金'
                                    break;
                                case 'attendance':
                                    resultObject.formula = '缺勤扣款'
                                    break;
                                case 'other':
                                    resultObject.formula = '其他扣款'
                                    break;
                                default:
                                    resultObject.formula = decodeURI(operand);
                                    break;
                            }
                            //resultObject.formula = operand;
                            
                            restResultArray.push(resultObject);

                        });

                        if (maxRange + minRange > 0) {
                            if (totalSum >= minRange && totalSum <= maxRange) {
                                resultArray = _.union(restResultArray);
                            }
                        } else {
                            resultArray = _.union(restResultArray);
                        }
                    });

                    return resultArray;
                }


                parallelObject = {
                    vacation   : vacation,
                    base       : base,
                    overtime   : overtime,
                    housingAdd : housingAdd,
                    communication: communication,
                    meal       :meal,
                    jobTitle   :jobTitle,
                    absence    :absence,
                    endowmentInsurance: endowmentInsurance,
                    unemploymentInsurance: unemploymentInsurance,
                    medicalInsurance: medicalInsurance,
                    housingFund     :housingFund,
                    attendance      :attendance,
                    cityHealth      :cityHealth,
                    other           :other
                };



                parallelTasks = [populateEarnings, populateDeductions];

                async.parallel(parallelTasks, function (err) {

                    if (err) {
                        return asyncCb(err);
                    }
                    earnings = payrollStructureType.earnings;
                    deductions = payrollStructureType.deductions;
                    for(var i = 0; i < earnings.length; i++){
                        if(earnings[i].name != '岗位工资' && earnings[i].name != '加班工资' && earnings[i].name != '职称补贴' && earnings[i].name != '住房补贴' && earnings[i].name != '餐费补贴' && earnings[i].name != '通讯补贴'){
                            var x = earnings[i].name;
                            otherArray.push(x);

                            parallelObject[earnings[i].formula[0].operand] = getEarning;
                        }
                    }

                    for(var i = 0; i < deductions.length; i++){
                        if(deductions[i].name != '养老保险' && deductions[i].name != '缺勤扣款' && deductions[i].name != '医疗保险' && deductions[i].name != '市医疗保险' && deductions[i].name != '失业保险' && deductions[i].name != '考勤扣款' && deductions[i].name != '住房公积金' && deductions[i].name != '其他扣款'){
                            var x = deductions[i].name;
                            anotherArray.push(x);
     
                            parallelObject[deductions[i].formula[0].operand] = getDeduction;
                        }
                    }

                    parallelFunctionsObject = getNamesFromFormula(earnings, deductions);

                    async.parallel(parallelFunctionsObject, function (err, result) {
                        if (err) {
                            return asyncCb(err);
                        }
                        payrollBody.earnings = getResultFormula(earnings, result);
                        payrollBody.deductions = getResultFormula(deductions, result);

                        payrollBody.date = endDate;

                        payrollBody.calc = 0;
                        payrollBody.paid = 0;

                        payrollBody.earnings.forEach(function (elem) {
                            payrollBody.calc += elem.amount;
                        });

                        var wage = payrollBody.calc;
                        
                        payrollBody.deductions.forEach(function (elem) {
                            payrollBody.calc -= elem.amount;
                        });

                        var taxableIncome = wage - ((result.attendance||0) + (result.unemploymentInsurance||0) + (result.endowmentInsurance||0) + (result.medicalInsurance||0) + (result.housingFund||0) + (result.communication||0))/100;
                        var nextWage = taxableIncome;
                        var taxAmount = 0;

                        var i = 1;
                        var obj = {};
                        parameters.tax.forEach(function (el) {
                            if (el._id !== null) {
                                obj[i] = el;
                                i++;
                            }
                        });

                        var tax = obj;
                        taxableIncome = taxableIncome - parameters.taxFree.base;
                        if(taxableIncome < 0){
                            taxableIncome = 0;
                        }
                        
                        var jsonlength = 0;
                        for(var i in tax){
                            jsonlength++;
                        }
                        for(var i = jsonlength; i >= 1; i--){
                            if(taxableIncome > tax[i].low){
                                taxAmount = taxableIncome * tax[i].rate - tax[i].countDeduction;
                                break;
                            }
                        }
                        if(taxAmount <= parameters.taxFree.deductible){
                            taxAmount = 0;
                        }
                        var nextTaxable = 0;
                        if(transfer.length > 1 && transferDateKey == year*100 + month){
                            taxAmount = 0;
                            if(taxableIncome > 0){
                                nextTaxable = taxableIncome;
                            }
                            else{
                                nextTaxable = nextWage;
                            }
                        }
                        payrollBody.taxableIncome = taxableIncome;
                        payrollBody.tax = taxAmount;
                        payrollBody.calc = payrollBody.calc - payrollBody.tax;
                        payrollBody.diff = payrollBody.calc - payrollBody.paid;
                        payrollBody.islow = islow;
                        if(transfer.length != 0){
                            payrollBody.department = transfer[0].department;
                        }
                        bodySalary.amount = payrollBody.calc * 100;
                        

                        if (!payrollBody.earnings.length && !payrollBody.deductions.length || (payrollBody.calc <= 0)) {
                            return asyncCb();
                        }

                        newPayrollModel = new Payroll(payrollBody);
                        removeJournalEntries = function (cb) {
                            var query = {
                                'sourceDocument._id': bodySalary.sourceDocument._id,
                                date                : new Date(bodySalary.date),
                                journal             : bodySalary.journal
                            };

                            journalEntry.removeByDocId(query, req.session.lastDb, cb);
                        };

                        createJournalEntries = function (result, cb) {
                            journalEntry.createReconciled(bodySalary, req.session.lastDb, cb, req.session.uId);
                        };

                        newPayrollModel.save(function (err, result) {
                            if (err) {
                                return asyncCb(err);
                            }
                            if (createJE) {
                                async.waterfall([removeJournalEntries, createJournalEntries], function (err, result) {
                                });
                            }
                            if(transfer.length > 1 && transferDateKey == year*100 + month){
                                salary = transfer[1].salary;
                                async.parallel(parallelFunctionsObject, function (err, otherResult) {
                                    if (err) {
                                        return asyncCb(err);
                                    }
                                    payrollBody.earnings = getResultFormula(earnings, otherResult);
                                    payrollBody.deductions = getResultFormula(deductions, otherResult);
                                    
                                    payrollBody.date = endDate;

                                    payrollBody.calc = 0;
                                    payrollBody.paid = 0;


                                    payrollBody.earnings.forEach(function (elem) {
                                        if(elem.formula == '职称补贴'){
                                            elem.amount = 0;
                                        }
                                        payrollBody.calc += elem.amount;
                                    });

                                    var wageSecond = payrollBody.calc;
                                    
                                    payrollBody.deductions.forEach(function (elem) {
                                        if(elem.formula == '养老保险' || elem.formula == '医疗保险' || elem.formula == '失业保险' || elem.formula == '住房公积金'){
                                            elem.amount = 0;
                                        }
                                        payrollBody.calc -= elem.amount;
                                    });

                                    var taxableIncomeSecond = wageSecond  - (otherResult.communication)/100;
                                    
                                    var taxAmountSecond = 0;
                                    var i = 1;
                                    var obj = {};
                                    parameters.tax.forEach(function (el) {
                                    if (el._id !== null) {
                                            obj[i] = el;
                                            i++;
                                        }
                                    });

                                    var tax = obj;
                                    if(taxableIncome > 0){
                                        taxableIncomeSecond = nextTaxable + taxableIncomeSecond;
                                    }
                                    else{
                                        taxableIncomeSecond = nextTaxable + taxableIncomeSecond - parameters.taxFree.base;
                                    }
                                    
                                    if(taxableIncomeSecond < 0){
                                        taxableIncomeSecond = 0;
                                    }
                                    payrollBody.taxableIncome = taxableIncomeSecond;
                                    var jsonlength = 0;
                                    for(var i in tax){
                                        jsonlength++;
                                    }
                                    for(var i = jsonlength; i >= 1; i--){
                                        if(taxableIncomeSecond > tax[i].low){
                                            taxAmountSecond = taxableIncomeSecond * tax[i].rate - tax[i].countDeduction;
                                            break;
                                        }
                                    }
                                    if(taxAmountSecond <= parameters.taxFree.deductible){
                                        taxAmountSecond = 0;
                                    }
                                    
                                    payrollBody.tax = taxAmountSecond;
                                    payrollBody.calc = payrollBody.calc - payrollBody.tax;
                                    payrollBody.diff = payrollBody.calc - payrollBody.paid;
                                    payrollBody.islow = islow;
                                    if(transfer.length > 1 && transferDateKey == year*100 + month){
                                         payrollBody.department = transfer[1].department;
                                    }
                                   
                                    bodySalary.amount = payrollBody.calc * 100;
                                    

                                    if (!payrollBody.earnings.length && !payrollBody.deductions.length || (payrollBody.calc <= 0)) {
                                        return asyncCb();
                                    }

                                    newPayrollModel = new Payroll(payrollBody);
                                    
                                    newPayrollModel.save(function (err, result) {
                                        if (err) {
                                            return asyncCb(err);
                                        }
                                        if (createJE) {
                                            journalEntry.createReconciled(bodySalary, req.session.lastDb, function (err, result) {}, req.session.uId);
                                        }

                                        asyncCb();
                                        
                                    });
                                });
                            }
                            else{
                                asyncCb();
                            }
                                
                        });
                    });
                });
            }, function (err, result) {
                if (err) {
                    return mainCb(err);
                }

                mainCb(null, result);
            });
        }

        async.waterfall([countTimeCard, countSocialInsurance, getTax, getTaxFree, getMinimumWage, getEmployees, generatePayroll], function (err, result) {
            if (err) {
                return next(err);
            }

            composeExpensesAndCache(req, function (err) {
                if (err) {
                    return next(err);
                }

                if (cbFromRecalc) {
                    cbFromRecalc(null, 'ok');
                } else {
                    res.status(200).send('ok');
                }
            });
        });

    }

    /* function generate(req, res, next, cbFromRecalc) {
     var db = req.session.lastDb;
     var Employee = models.get(db, 'Employees', EmployeeSchema);
     var Payroll = models.get(db, 'PayRoll', PayRollSchema);
     var JournalEntry = models.get(req.session.lastDb, 'journalEntry', journalEntrySchema);
     var data = req.body;
     var month = parseInt(data.month, 10);
     var year = parseInt(data.year, 10);
     var dataKey = year * 100 + month;
     var waterfallTasks;
     var employees;
     var ids = {};
     var i;
     var date = moment().year(year).month(month - 1).startOf('month');
     var endDate = moment(date).endOf('month');
     var employeesIds = [];

     date = new Date(date);
     endDate = new Date(endDate);

     if (!data.month || !data.year) {
     return res.status(400).send();
     }

     function getEmployees(callback) {
     var queryObject = {
     //  isEmployee: true,
     department: {
     $in: departmentArray
     }
     };

     var query = Employee.find({} /!* queryObject*!/, {transfer: 1, fire: 1}).lean();

     query.exec(function (err, result) {
     if (err) {
     return callback(err);
     }

     employees = result;

     result.forEach(function (elem) {
     var salary = 0;
     var hire = elem.transfer;
     var fire = elem.fire;
     var length = hire.length;
     var dateToCreate = endDate;
     var localDate = new Date(moment().year(year).month(month - 1).endOf('month').set({
     hour  : 15,
     minute: 1,
     second: 0
     }));
     var daysInMonth;
     var payForDay;
     var department;
     var hireKey = moment(new Date(hire[0].date)).year() * 100 + moment(new Date(hire[0].date)).month() + 1;
     var fireKey = fire[0] ? moment(new Date(fire[0])).year() * 100 + moment(new Date(fire[0])).month() + 1 : Infinity;
     var localKey = moment(dateToCreate).year() * 100 + moment(dateToCreate).month() + 1;

     journalEntry.removeByDocId({
     'sourceDocument._id': elem._id,
     journal             : CONSTANTS.ADMIN_SALARY_JOURNAL,
     date                : localDate
     }, req.session.lastDb, function () {

     });

     for (i = length - 1; i >= 0; i--) {
     if (dateToCreate >= hire[i].date && (hire[i].status !== 'fired')) {
     salary = hire[i].salary;
     department = hire[i].department;
     break;
     } else {
     department = hire[i].department;
     }
     }

     if (hireKey === localKey) {
     daysInMonth = moment(dateToCreate).endOf('month').date();
     payForDay = salary / daysInMonth;

     salary = payForDay * (daysInMonth - moment(new Date(hire[0].date)).date() + 1);
     }

     if (fireKey === localKey) {
     daysInMonth = moment(dateToCreate).endOf('month').date();
     payForDay = salary / daysInMonth;

     salary = payForDay * moment(new Date(fire[0])).date();
     } else if (fireKey < localKey) {
     salary = 0;
     }

     if (salary || (salary === 0)) {
     ids[elem._id] = {
     salary    : salary,
     department: department
     };
     }
     });

     employeesIds = Object.keys(ids);

     callback(null, ids);
     });
     }

     function getJournalEntries(ids, callback) {
     /!* function matchEmployee(pcb) {
     JournalEntry.aggregate([{
     $match: {
     'sourceDocument.model': 'Employees',
     journal               : {$in: [ObjectId(CONSTANTS.IDLE_PAYABLE), ObjectId(CONSTANTS.VACATION_PAYABLE)]},
     date                  : {
     $gte: new Date(date),
     $lte: new Date(endDate)
     }
     }
     }, {
     $project: {
     employee: '$sourceDocument._id',
     debit   : {$divide: ['$debit', 100]},
     credit  : {$divide: ['$credit', 100]},
     journal : 1,
     date    : 1
     }
     }, {
     $group: {
     _id: {
     employee: '$employee',
     journal : '$journal'
     },

     debit : {$sum: '$debit'},
     credit: {$sum: '$credit'}
     }
     }, {
     $group: {
     _id : '$_id.employee',
     root: {$push: '$$ROOT'}
     }
     }], function (err, result) {
     if (err) {
     return pcb(err);
     }

     pcb(null, result);
     });
     }*!/

     function matchByWTrack(pcb) {
     /!* JournalEntry.aggregate([{
     $match: {
     // 'sourceDocument.model': 'wTrack',
     journal: {$in: journalArray},
     debit  : {$gt: 0},
     date   : {
     $gte: new Date(date),
     $lte: new Date(endDate)
     }
     }
     }, {
     $project: {
     debit  : {$divide: ['$debit', 100]},
     journal: {
     $cond: {
     if: {
     $eq: ['$journal', ObjectId(CONSTANTS.VACATION_PAYABLE)]
     },

     then: 'vacation',
     else: {
     $cond: {
     if: {
     $eq: ['$journal', ObjectId(CONSTANTS.OVERTIME_PAYABLE)]
     },

     then: 'overtime',
     else: 'base'
     }
     }
     }
     },

     date    : 1,
     employee: {
     $cond: {
     if: {
     $ifNull: ['$sourceDocument.employee', null]
     },

     then: '$sourceDocument._id',
     else: '$sourceDocument.employee'
     }
     }
     }
     }, {
     $project: {
     journal : 1,
     amount  : '$debit',
     employee: '$employee'
     }
     }, {
     $match: {
     amount: {$gt: 0}
     }
     }, {
     $group: {
     _id: {
     employee: '$employee',
     journal : '$journal'
     },

     amount : {$sum: '$amount'},
     journal: {$first: '$journal'}
     }
     }, {
     $group: {
     _id : '$_id.employee',
     root: {$push: '$$ROOT'}
     }
     }], function (err, result) {
     if (err) {
     return pcb(err);
     }

     pcb(null, result);
     });*!/

     /!* Employee.aggregate([{
     $match: {
     _id: {$in: employeesIds.objectID()}
     }
     }, {
     $lookup: {
     from        : 'journalentries',
     localField  : '_id',
     foreignField: 'sourceDocument.employee',
     as          : 'vacationsAndIdle'
     }
     }, {
     $lookup: {
     from        : 'journalentries',
     localField  : '_id',
     foreignField: 'sourceDocument._id',
     as          : 'workedAndOvertime'
     }
     }, {
     $project: {
     vacationsAndIdle: {
     $filter: {
     input: '$vacationsAndIdle',
     as   : 'item',

     cond: {
     $and: [{
     $gte: ['$$item.date', date]
     }, {
     $lte: ['$$item.date', endDate]
     }, {
     $gt: ['$$item.debit', 0]

     }]
     }
     }
     },

     workedAndOvertime: {
     $filter: {
     input: '$vacationsAndIdle',
     as   : 'item',

     cond: {
     $and: [{
     $gte: ['$$item.date', date]
     }, {
     $lte: ['$$item.date', endDate]
     }, {
     $gt: ['$$item.debit', 0]
     }]
     }
     }
     }
     }
     }, {
     $project: {
     vacation: {
     $filter: {
     input: '$vacationsAndIdle',
     as   : 'item',

     cond: {
     $eq: ['$$item.journal', ObjectId(CONSTANTS.VACATION_PAYABLE)]
     }
     }
     },

     overtime: {
     $filter: {
     input: '$workedAndOvertime',
     as   : 'item',

     cond: {
     $eq: ['$$item.journal', ObjectId(CONSTANTS.OVERTIME_PAYABLE)]
     }
     }
     },

     worked: {
     $filter: {
     input: '$workedAndOvertime',
     as   : 'item',

     cond: {
     $eq: ['$$item.journal', ObjectId(CONSTANTS.SALARY_PAYABLE)]
     }
     }
     },

     idle: {
     $filter: {
     input: '$vacationsAndIdle',
     as   : 'item',

     cond: {
     $eq: ['$$item.journal', ObjectId(CONSTANTS.IDLE_PAYABLE)]
     }
     }
     }
     }
     }, {
     $unwind: {
     path                      : '$vacation',
     preserveNullAndEmptyArrays: true
     }
     }, {
     $unwind: {
     path                      : '$idle',
     preserveNullAndEmptyArrays: true
     }
     }, {
     $unwind: {
     path                      : '$overtime',
     preserveNullAndEmptyArrays: true
     }
     }, {
     $unwind: {
     path                      : '$worked',
     preserveNullAndEmptyArrays: true
     }
     }, {
     $group: {
     _id     : '$_id',
     vacation: {$sum: '$vacation.debit'},
     idle    : {$sum: '$idle.debit'},
     overtime: {$sum: '$overtime.debit'},
     worked  : {$sum: '$worked.debit'}
     }
     }, {
     $project: {
     vacation: {$divide: ['$vacation', 100]},
     idle    : {$divide: ['$idle', 100]},
     overtime: {$divide: ['$overtime', 100]},
     worked  : {$divide: ['$worked', 100]},
     total   : {$divide: [{$add: ['$vacation', '$idle', '$overtime', '$worked']}, 100]}
     }
     }], function (err, result) {
     if (err) {
     return pcb(err);
     }

     pcb(null, result);
     });*!/
     }

     async.parallel([matchByWTrack/!* , matchEmployee*!/], function (err, result) {
     var empIds;
     var empIdsSecond;
     var resultArray;

     if (err) {
     return callback(err);
     }

     empIds = _.pluck(result[0], '_id');
     empIdsSecond = _.pluck(result[1], '_id');

     resultArray = _.union(result[0], result[1]);

     callback(null, {
     resultByEmployee: result[1],
     resultByWTrack  : result[0],
     ids             : _.union(empIds, empIdsSecond),
     empIds          : ids
     });
     });
     }

     function savePayroll(resultItems, callback) {
     var resultByEmployee = resultItems.resultByEmployee;
     var resultByWTrack = resultItems.resultByWTrack;
     var ids = resultItems.ids;
     var empIds = resultItems.empIds;
     var empKeys = Object.keys(empIds);
     var newPayroll;
     var parallelTasks;
     var startBody = {
     year   : year,
     month  : month,
     dataKey: dataKey,
     paid   : 0
     };
     var localDate = new Date(moment().isoWeekYear(year).month(month - 1).endOf('month').set({
     hour  : 15,
     minute: 1,
     second: 0
     }));

     function createForNotDev(pCb) {
     async.each(empKeys, function (employee, asyncCb) {
     var cb;
     var bodyAdminSalary;

     startBody.employee = employee;
     startBody.calc = empIds[employee].salary;
     startBody.diff = empIds[employee].salary;

     cb = _.after(2, asyncCb);

     bodyAdminSalary = {
     currency      : CONSTANTS.CURRENCY_USD,
     journal       : CONSTANTS.ADMIN_SALARY_JOURNAL,
     date          : localDate,
     sourceDocument: {
     model: 'Employees'
     }
     };

     if (departmentArray.indexOf(empIds[employee].department.toString()) === -1) {
     return asyncCb();
     }

     if (startBody.calc) {
     newPayroll = new Payroll(startBody);

     bodyAdminSalary.sourceDocument._id = employee;
     bodyAdminSalary.amount = empIds[employee].salary * 100;

     journalEntry.createReconciled(bodyAdminSalary, req.session.lastDb, cb, req.session.uId);

     newPayroll.save(cb);
     } else {
     asyncCb();
     }

     }, function () {
     pCb();
     });
     }

     function createForDev(pCb) {
     var newArray = [];

     ids.forEach(function (el) {
     newArray.push(el.toString());
     });

     newArray = _.uniq(newArray);

     async.each(newArray, function (id, asyncCb) {
     var journalEntryEmp = _.find(resultByEmployee, function (el) {
     return el._id.toString() === id.toString();
     });

     var journalEntrywTrack = _.find(resultByWTrack, function (el) {
     return el._id.toString() === id.toString();
     });

     var sumFirst = parseFloat(journalEntryEmp ? (journalEntryEmp.debit || journalEntryEmp.credit).toFixed(2) : '0');
     var sumSecond = parseFloat(journalEntrywTrack ? (journalEntrywTrack.debit || journalEntrywTrack.credit).toFixed(2) : '0');

     startBody.employee = id;
     startBody.calc = sumFirst + sumSecond;
     startBody.diff = startBody.calc;
     startBody.month = month;
     startBody.year = year;
     startBody.dataKey = startBody.year * 100 + startBody.month;
     startBody.date = localDate;

     newPayroll = new Payroll(startBody);

     newPayroll.save(asyncCb);
     }, function () {
     pCb();
     });
     }

     parallelTasks = [createForDev, createForNotDev];

     async.parallel(parallelTasks, function (err) {
     if (err) {
     return callback(err);
     }

     callback();
     });
     }

     waterfallTasks = [getEmployees, getJournalEntries, savePayroll];

     async.waterfall(waterfallTasks, function (err) {
     if (err) {
     return next(err);
     }

     composeExpensesAndCache(req, function (err) {
     if (err) {
     return next(err);
     }

     if (cbFromRecalc) {
     cbFromRecalc(null, 'ok');
     } else {
     res.status(200).send('ok');
     }
     });
     });

     }*/

    function recount(req, res, next) {
        var db = req.session.lastDb;
        var data = req.body;
        var dataKey = parseInt(data.dataKey, 10);
        var year;
        var month;
        var Payroll = models.get(db, 'PayRoll', PayRollSchema);
        var waterfallFunc;

        if (!dataKey) {
            year = parseInt(data.year, 10);
            month = parseInt(data.month, 10);
            dataKey = year * 100 + month;
        } else if (data.dataKey) {
            year = parseInt(data.dataKey.slice(0, 4), 10);
            month = parseInt(data.dataKey.slice(4), 10);
        }

        if (!dataKey && !month && !year) {
            return res.status(400).send();
        }

        req.body.month = month;
        req.body.year = year;
        function removeByDataKey(wfCb) {
            Payroll.aggregate([
                {
                    $lookup: {
                        from: 'Department',
                        localField: 'department',
                        foreignField: '_id',
                        as: 'department'
                    }
                },
                {
                    $project: {
                        department: {$arrayElemAt: ['$department', 0]},
                        dataKey: 1
                    }
                },
                {
                    $match: {
                        dataKey: dataKey,
                        'department.externalId': 'A'
                    }
                }
            ], function(err, result){
                if(err){
                    wfCb(err);
                }
                async.each(result, function(item, cb){
                    Payroll.findByIdAndRemove(item._id, function(err, result){
                        if(err){
                            cb(err)
                        }
                        cb()
                    })
                }, function(err){
                    if(err){
                        wfCb(err)
                    }
                    wfCb(null, 'OK');
                })
            })
            // Payroll.remove({dataKey: dataKey}, function (err, result) {
            //     if (err) {
            //         return wfCb(err);
            //     }

            //     wfCb(null, result);
            // });
        }

        // function createIdleByMonth(removed, wfCb) {
        //     journalEntry.createIdleByMonth({req: req, callback: wfCb, month: month, year: year});
        // }

        function generateByDataKey(removed, wfCb) {
            generate(req, res, next, wfCb);
        }

        waterfallFunc = [removeByDataKey, generateByDataKey];

        async.waterfall(waterfallFunc, function (err, result) {
            if (err) {
                return next(err);
            }

            if (typeof res.status === 'function') {
                res.status(200).send({success: true});
            } else {
                res();
            }

        });

    }

    this.recount = function (req, res, next) {
        recount(req, res, next);
    };

    this.recountAll = function (req, res, next) {
        var data = req.body.dataArray;

        async.each(data, function (dataKey, cb) {
            req.body = {};
            req.body.dataKey = dataKey;

            setTimeout(function () {
                recount(req, cb, cb);
            }, 10);
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: true});
        });

    };

    this.generate = function (req, res, next) {
        recount(req, res, next);
    };
};

module.exports = Module;
