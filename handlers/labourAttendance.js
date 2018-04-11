var mongoose = require('mongoose');
var async = require('async');
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
    var scanlogSchema = mongoose.Schemas.scanlog;
    var workPointSchema = mongoose.Schemas.workPoint;
    var dailyReportSchema = mongoose.Schemas.dailyReport;
    var plantWorkGroupSchema = mongoose.Schemas.plantWorkGroup;
    var objectId = mongoose.Types.ObjectId;

    var CONSTANTS = require('../constants/mainConstants.js');
    var _ = require('lodash');
    var mapObject = require('../helpers/bodyMaper');
    var pageHelper = require('../helpers/pageHelper');
    var composeExpensesAndCache = require('../helpers/expenses')(models);
    var JournalEntryHandler = require('./journalEntry');
    var journalEntry = new JournalEntryHandler(models);
    var FilterMapper = require('../helpers/filterMapper');

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
        var scanlogModel = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var workPointModel = models.get(req.session.lastDb, 'workPoint', workPointSchema);
        var dailyReportModel = models.get(req.session.lastDb, 'dailyReport', dailyReportSchema);
        var plantWorkGroupModel = models.get(req.session.lastDb, 'plantWorkGroup', plantWorkGroupSchema);
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
                        'department.externalId': 'C'
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
                        'department.externalId': 'C'
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
            }, {
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
                    department: {$arrayElemAt: ['$department', 0]},
                    accommodation: 1,
                    dinning      : 1
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
                    hire: '$transfer',
                    accommodation : 1,
                    dinning       : 1
                }
            }, {
                $project: {
                    transferDate: {$max: '$transfer.date'},
                    transfer    : 1,
                    name        : 1,
                    fire        : 1,
                    hire        : 1,
                    identNo     : 1,
                    accommodation : 1,
                    dinning       : 1
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
                    identNo     : 1,
                    accommodation : 1,
                    dinning       : 1
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
                    identNo: 1,
                    accommodation : 1,
                    dinning       : 1
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
                    identNo             : 1,
                    accommodation       : 1,
                    dinning             : 1
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
                    identNo             : 1,
                    accommodation       : 1,
                    dinning             : 1
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
                    identNo             : 1,
                    accommodation       : 1,
                    dinning             : 1
                }
            }
            ], function (err, result) {
                if (err) {
                    return mainCb(err);
                }
                mainCb(null, result);
            });
        }

        function generatePayroll(employeesResult, mainCb) {
            async.each(employeesResult, function (empObject, asyncCb) {
                var employee = empObject._id;
                var employeeName = empObject.name;
                var department = empObject.department;
                var accommodation = empObject.accommodation || 0;
                var dinning = empObject.dinning || 0;
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

                function getSalary(waterfallCb){
                    function getScanlog(cb){
                        scanlogModel.aggregate([
                            {
                                $lookup: {
                                    from: 'plantWorkGroup',
                                    localField: 'workGroup',
                                    foreignField: '_id',
                                    as: 'workGroup'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'barCode',
                                    localField: 'barCode',
                                    foreignField: '_id',
                                    as: 'barCode'
                                }
                            },
                            {
                                $project: {
                                    workGroup: {$arrayElemAt: ['$workGroup', 0]},
                                    price: 1,
                                    scantime: 1,
                                    year: {$year: '$scantime'},
                                    month: {$month: '$scantime'}
                                }
                            },
                            {
                                $match: {
                                    year: year,
                                    month: month
                                }
                            },
                            {
                                $project: {
                                    'workGroup._id'   : '$workGroup._id',
                                    'workGroup.leader'   : '$workGroup.leader',
                                    'workGroup.members'   : '$workGroup.members',
                                    price: 1,
                                    scantime: 1
                                }
                            },
                            {
                                $unwind: '$workGroup.members'
                            },
                            {
                                $match: {
                                    $or: [
                                        {
                                            'workGroup.leader': objectId(employee)
                                        },
                                        {
                                            'workGroup.members': objectId(employee)
                                        }
                                    ]
                                }
                            },
                            {
                                $project: {
                                    'workGroup._id'   : 1,
                                    price: 1,
                                    scantime: 1
                                }
                            }
                        ],function(err, result){
                            if(err){
                                return cb(err);
                            }
                            cb(null, result);
                        });
                    }
                    
                    function calc(scanlogs, cb){
                        async.map(scanlogs, function(scanlog, asyncCb){
                            var scantime = scanlog.scantime;
                            var workGroupId = scanlog.workGroup._id;
                            var price = scanlog.price;
                            plantWorkGroupModel.findById(workGroupId, function(err, groupInfo){
                                if(err){
                                    return asyncCb(err)
                                }
                                var members = groupInfo.members
                                members.push(groupInfo.leader);
                                async.map(members, function(member, asyncCb2){
                                     workPointModel.aggregate([
                                        {
                                            $match:{
                                                employee: objectId(member),
                                                date: {$lte: scantime}
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: 'Employees',
                                                localField: 'employee',
                                                foreignField: '_id',
                                                as: 'employee'
                                            }
                                        },
                                        {
                                            $project: {
                                                employee: {$arrayElemAt: ['$employee', 0]},
                                                date: 1,
                                                point: 1
                                            }
                                        },
                                        {
                                            $project: {
                                                'employee._id': '$employee._id',
                                                'employee.name': '$employee.name',
                                                date: 1,
                                                point: 1
                                            }
                                        },
                                        {
                                            $sort: {
                                                date: -1
                                            }
                                        }
                                    ],function(err, employeeInfo){
                                        if(err){
                                            return asyncCb2(err)
                                        }
                                        if(employeeInfo.length == 0){
                                            var error = new Error('有员工在扫码前没有设置工分');
                                            error.status = 400;
                                            asyncCb2(error);
                                        }
                                        else{
                                            var data = {
                                                _id: employeeInfo[0].employee._id,
                                                name: employeeInfo[0].employee.name,
                                                workPoints: employeeInfo[0].point|| 1
                                            }
                                            asyncCb2(null, data);
                                        }
                                      })
                                }, function(err, workPointResult){
                                    if(err){
                                        return asyncCb(err)
                                    }
                                    var total = 0;
                                    var curPoint = 0;
                                    for(var i=0; i<workPointResult.length; i++){
                                        total = total + workPointResult[i].workPoints; 
                                        if(workPointResult[i]._id.toString() == employee.toString()){
                                            curPoint = workPointResult[i].workPoints;
                                        }
                                    }
                                    var rate = curPoint/total;
                                    var money = price*rate;
                                    scanlog.rate = rate;
                                    scanlog.money = money;
                                    asyncCb(null, scanlog);
                                })
                            })
                        }, function(err, result){
                            if(err){
                                cb(err);
                            }

                            var pieceTotal = 0;
                            for(var i=0; i<result.length; i++){
                                pieceTotal += result[i].money;
                            }
                            cb(null, pieceTotal);
                        })
                    }

                    async.waterfall([getScanlog, calc], function(err, result){
                        if(err){
                            return next(err);
                        }
                        console.log(result);
                        waterfallCb(null,result);
                    })
                }

                function calcSalary(salary, waterfallCb) {
                        salary = salary;
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
                            if(salary > parameters.taxFree.base){
                                var overtimeAmount = (salary - parameters.minimumWage.communication/100 - parameters.minimumWage.wage)*100;
                                pcb(null, overtimeAmount || 0);
                            }
                            else if(salary <= parameters.taxFree.base && salary > parameters.minimumWage.wage){
                                var overtime = (salary - parameters.minimumWage.wage)*100;
                                pcb(null, overtime);
                            }
                            else if(salary < parameters.minimumWage.wage){
                                pcb(null, 0);
                            }
                        }

                        function base(pcb) {
                            pcb(null, parameters.minimumWage.wage);
                        }

                        function housingAdd(pcb){
                            timeCard.aggregate([
                                {
                                    $match: {
                                        employee: objectId(employee),
                                        year: year,
                                        month: month
                                    }
                                },
                                {
                                    $project: {
                                        rate: 1,
                                        otrate: 1
                                    }
                                }
                                ],function(err, result){
                                    if(err){
                                        pcb(err)
                                    }
                                    var total = 0;
                                    var resultItem;
                                    for(var i=0; i<result.length; i++){
                                        if(result[i].rate>0 && result[i].rate<5){
                                            total = total + result[i].rate;
                                        }
                                    }
                                    resultItem = Math.floor(total)*accommodation;
                                    pcb(null, resultItem*100 || 0);
                                })
                        }

                        function communication(pcb){
                            if(salary > parameters.taxFree.base){
                                pcb(null, parameters.minimumWage.communication);
                            }
                            else if(salary <= parameters.taxFree.base && salary > parameters.minimumWage.wage){
                                pcb(null, 0);
                            }
                            else{
                                pcb(null, 0);
                            }
                        }

                        function meal(pcb){
                            timeCard.aggregate([
                                {
                                    $match: {
                                        employee: objectId(employee),
                                        year: year,
                                        month: month
                                    }
                                },
                                {
                                    $project: {
                                        rate: 1,
                                        otrate: 1
                                    }
                                }
                                ],function(err, result){
                                    if(err){
                                        pcb(err)
                                    }
                                    var total = 0;
                                    var otTotal = 0;
                                    var resultItem;
                                    for(var i=0; i<result.length; i++){
                                        if(result[i].rate>0 && result[i].rate<5){
                                            total = total + result[i].rate;
                                        }
                                        if(result[i].otrate>0){
                                            otTotal =  otTotal + 1;
                                        }
                                    }
                                    resultItem = (Math.floor(total) + otTotal)*dinning;
                                    pcb(null, resultItem*100 || 0);
                                })
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
                            MinimumWage.aggregate([
                                {
                                    $project: {
                                        wage: 1
                                    }
                                }
                            ],function(err, res){
                                var wage = res[0].wage;
                                var total = 0;
                                if(salary<wage){
                                    total = wage-salary*100;
                                }

                                pcb(null, total);
                            });
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
                                return waterfallCb(err);
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
                                    return waterfallCb(err);
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
                                    return waterfallCb();
                                }
                                //console.log('payrollBody',payrollBody);
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
                                        return waterfallCb(err);
                                    }
                                    if (createJE) {
                                        async.waterfall([removeJournalEntries, createJournalEntries], function (err, result) {
                                        });
                                    }
                                    if(transfer.length > 1 && transferDateKey == year*100 + month){
                                        salary = transfer[1].salary;
                                        async.parallel(parallelFunctionsObject, function (err, otherResult) {
                                            if (err) {
                                                return waterfallCb(err);
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
                                                return waterfallCb();
                                            }
                                            console.log('payrollBody',payrollBody);
                                            newPayrollModel = new Payroll(payrollBody);
                                            
                                            newPayrollModel.save(function (err, result) {
                                                if (err) {
                                                    return waterfallCb(err);
                                                }
                                                if (createJE) {
                                                    journalEntry.createReconciled(bodySalary, req.session.lastDb, function (err, result) {}, req.session.uId);
                                                }

                                                waterfallCb();
                                                
                                            });
                                        });
                                    }
                                    else{
                                        waterfallCb();
                                    } 
                                });
                            });
                        });
                }

                async.waterfall([getSalary, calcSalary], function(err, result){
                    if(err){
                        asyncCb(err);
                    }
                    asyncCb();
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
                        'department.externalId': 'C'
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
            // .remove({dataKey: dataKey}, function (err, result) {
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

    this.generate = function (req, res, next) {
        recount(req, res, next);
    };

};
module.exports = Module;