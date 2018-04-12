var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var dailyReportSchema = mongoose.Schemas.dailyReport;
    var employeeSchema = mongoose.Schemas.Employee;
    var userSchema = mongoose.Schemas.User;

    //引入async(异步)模块
    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');
    var accessRoll = require('../helpers/accessRollHelper')(models);

    //插入数据
    this.create = function (req, res, next) {
        var db = req.session.lastDb;
        var dailyReportModel = models.get(db, 'dailyReport', dailyReportSchema);
        var employeeModel = models.get(db, 'Employees', employeeSchema);
        var userModel = models.get(db, 'Users', userSchema);
        var dailyReport;
        var data = req.body;//获得文档类型
        data.userId = req.session.uId;
        var date = new Date();
        var nowDay = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        data.dateStr = nowDay;
        data.status = 'new';

        userModel.findOne({_id : req.session.uId}, function (err, user) {
            if (err) {
                return next(err);
            }

            employeeModel.findOne({_id: user.relatedEmployee}, function (err, employee) {
                if (err) {
                    return next(err);
                }

                data.whoCanRW = employee.whoCanRW;
                data.groups= {};
                data.groups.owner = employee.groups.owner;
                data.groups.users = employee.groups.users;
                data.groups.group = employee.groups.group;
                console.log(data);
                dailyReport = new dailyReportModel(data);//到这里就获得了可操作的类似于collection的对象

                dailyReport.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send(result);
                });
            });
        });
    };

    //修改数据
    this.patchM = function (req, res, next) {
        var dailyReportModel = models.get(req.session.lastDb, 'dailyReport', dailyReportSchema);
        var id = req.params.id;
        var data = req.body;
        if(data.content == null || data.content.length == 0) {
            delete data.content;
        }
        if(data.review == null || data.review.length == 0) {
            delete data.review;
        } else {
            data.status = 'old';
        }
        //替换data数据
        dailyReportModel.findByIdAndUpdate(id, {$set : data}, {new: true},
            function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
    };

    //查询所有dailyReportModel类型数据
    this.getList = function (req, res, next) {
        var dailyReportModel = models.get(req.session.lastDb, 'dailyReport', dailyReportSchema);
        var employeeModel = models.get(req.session.lastDb, 'Employees', employeeSchema);
        var data = req.query;
        var sort = {status : 1, _id : -1};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var parallelTasks;

        var accessRollSearcher = function(cb) {
            accessRoll(req, dailyReportModel, cb);
        };


        //返回共有多少条数据
        var getTotal = function (pCb) {

            dailyReportModel.count(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        parallelTasks = [getTotal, accessRollSearcher];

        //并行且无关联，有一个流程出错就抛错
        async.parallel(parallelTasks, function (err, result) {
            var count;
            var response = {};

            if (err) {
                return next(err);
            }

            count = result[0] || 0;
            var dailyReportIds = result[1].objectID();

            dailyReportModel
                .aggregate([
                    {
                        $match:{'_id': {$in : dailyReportIds}}
                    },
                    {
                        $lookup:
                            {
                                from: 'Users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user'
                            }
                    },
                    {
                        $unwind: '$user'
                    },
                    {
                        $lookup:
                            {
                                from: 'Employees',
                                localField: 'user.relatedEmployee',
                                foreignField: '_id',
                                as: 'employee'
                            }
                    },
                    {
                        $project: {
                            _id     : 1,
                            userId  : 1,
                            dateStr : 1,
                            status  : 1,
                            content : 1,
                            review  : 1,
                            groups  : 1,
                            whoCanRW: 1,
                            employee: {$arrayElemAt:['$employee', 0]},
                            user    :'$user'
                        }
                    }
                ])
                .skip(skip)
                .limit(limit)
                .sort(sort)
                .exec(function (err, dailyReports) {
                    if (err) {
                        return next(err);
                    }

                    response.total = count;
                    response.data = dailyReports;
                    res.status(200).send(response);
                });
        });

        // employeeModel
        //     .findOne({_id : req.session.uId})
        //     .lean()
        //     .exec(function (err, employee) {
        //     if (err) {
        //         return next(err);
        //     }
        //         employeeModel
        //             .find({department:employee.department})
        //             .lean()
        //             .exec(function (err, employees) {
        //                 if (err) {
        //                     return next(err);
        //                 }
        //
        //                 var ids = [];
        //                 for (var i=0; i<employees.length; i++ ) {
        //                     ids.push(employees[i]._id);
        //                 }
        //                 dailyReportModel
        //                     .aggregate([
        //                         {
        //                             $match:{userId: {$in: ids}}
        //                         },
        //                         {
        //                             $lookup:
        //                                 {
        //                                     from: "Employees",
        //                                     localField: "userId",
        //                                     foreignField: "_id",
        //                                     as: "employee"
        //                                 }
        //                         },
        //                         {
        //                             $unwind: "$employee"
        //                         }
        //                     ])
        //                     // .skip(skip)
        //                     // .limit(limit)
        //                     .sort(sort)
        //                     .exec(function (err, dailyReports) {
        //                     if (err) {
        //                         return next(err);
        //                     }
        //                         dailyReports.forEach(function(item, index){
        //                            if(item.userId == req.session.uId) {
        //                                item.mode = '我的日报';
        //                            }
        //                            else {
        //                                item.mode = '同组';
        //                            }
        //                         });
        //                         getChildList(dailyReports.length, dailyReports);
        //                         //res.status(200).send({total:dailyReports.length,data:dailyReports});
        //                     });
        //             });
        //         });
        // function getChildList(total, data) {
        //     employeeModel
        //         .find({manager:req.session.uId})
        //         .lean()
        //         .exec(function (err, employees) {
        //             if (err) {
        //                 return next(err);
        //             }
        //             var ids = [];
        //             for (var i=0; i<employees.length; i++ ) {
        //                 ids.push(employees[i]._id);
        //             }
        //             dailyReportModel
        //                 .aggregate([
        //                     {
        //                         $match:{userId: {$in: ids}}
        //                     },
        //                     {
        //                         $lookup:
        //                             {
        //                                 from: "Employees",
        //                                 localField: "userId",
        //                                 foreignField: "_id",
        //                                 as: "employee"
        //                             }
        //                     },
        //                     {
        //                         $unwind: "$employee"
        //                     }
        //                 ])
        //                 .sort(sort)
        //                 .exec(function (err, dailyReports) {
        //                     if (err) {
        //                         return next(err);
        //                     }
        //                     dailyReports.forEach(function(item, index){
        //                         item.mode = '下属';
        //                     });
        //                     dailyReports.push.apply(dailyReports, data);
        //                     res.status(200).send({total:total+employees.length,data:dailyReports});
        //                 });
        //         });
        // }
    };



    //删除日报
    this.remove = function (req, res, next) {
        var dailyReportModel = models.get(req.session.lastDb, 'dailyReport', dailyReportSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        dailyReportModel.remove({_id: {$in: ids}}, function (err, removed) {
            if (err) {
                return next(err);
            }

            res.status(200).send(removed);
        });
    };

    //找到当前用户日报
    this.getUserList = function (req, res, next) {
        var Reports = models.get(req.session.lastDb, 'dailyReport', dailyReportSchema);
        //var id = req.params.id;
        var id = mongoose.Types.ObjectId(req.params.id);
        /**
         * 这里的lean()使查询所得的结果转换为json类型
         */
        // 参数在url中时
        // /path/:id,参数在req.params.id中
        // /path?id=xx,参数在req.query.id中
        //
        // 用json body 或者form 表单传参时参数在req.body中
        Reports
            .aggregate([
                {
                    $match:{_id : id}
                },
                {
                    $lookup:
                        {
                            from: 'Users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'user'
                        }
                },
                {
                    $unwind: '$user'
                },
                {
                    $lookup:
                        {
                            from: 'Employees',
                            localField: 'user.relatedEmployee',
                            foreignField: '_id',
                            as: 'employee'
                        }
                },
                {
                    $project: {
                        _id     :1,
                        userId  : 1,
                        dateStr : 1,
                        status  : 1,
                        content : 1,
                        review  : 1,
                        groups  : 1,
                        whoCanRW: 1,
                        employee: {$arrayElemAt:['$employee', 0]},
                        user    :'$user'
                    }
                }
            ])
            // .sort({status : 1, dateStr : -1})
            // .select('_id dateStr content review')
            .exec(function (err, dailyReports) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(dailyReports[0]);
            });
    };
};

module.exports = Module;
