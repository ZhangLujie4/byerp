var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    //获得workPiont的文档类型
    var workPointSchema = mongoose.Schemas.workPoint;
    var HistoryService = require('../services/history.js')(models);
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');

    //为返回到view的数据库信息进行处理，返回数据或错误
    this.getForView = function (req, res, next) {
        //得到所用的DB object
        var db = req.session.lastDb;

        var workPoint = models.get(db, 'workPoints', workPointSchema);
        var data = req.query;                                         //TODO 得到请求的query，相当于collection
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var keys;
        //并行项目
        var parallelTasks;
        var filterObj = {};
        var optionsObject = [];
        var filter = data.filter || {};
        var contentType = data.contentType || 'workPoint';
        var filterMapper = new FilterMapper();

        //过滤
        if (filter) {
            filterObj = filterMapper.mapFilter(filter, contentType); // caseFilterOpp(filter);
        }

        optionsObject.push(filterObj);

        //排序
        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'point': -1};
        }

        workPoint
        .find({status: 'true'})
        .populate('employee', '_id name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec( function (err, result) {
            if (err) {
                return next(err);
            }
            var response = {
                total: result.length,
                data: result
            }
            res.status(200).send(response);
        });
    };

    //增
    this.create = function (req, res, next) {
        var db = req.session.lastDb;
        var workPointModel = models.get(db, 'workPoints', workPointSchema);
        var workPoint;
        var data = req.body;//获得文档类型
        data.createdBy = {
            user: req.session.uId,
            date: new Date()
        };
        data.status = 'true';
        data.date = new Date();
        workPoint = new workPointModel(data);//到这里就获得了可操作的类似于collection的对象
        workPoint.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    //删
    this.delete = function (req, res, next) {
        var db = req.session.lastDb;
        var workPointModel = models.get(db, 'workPoints', workPointSchema);
        var id = req.params.id;
        workPoint.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    //改
    this.update = function (req, res, next) {
        var db = req.session.lastDb;
        var workPointModel = models.get(db, 'workPoints', workPointSchema);
        var id = req.params.id;
        var data = req.body;
        data.editedBy = {
            uesr: req.session.uId,
            date: new Date()
        };
        workPointModel.findByIdAndUpdate(id, {status: 'false'}, {new: true}, function(err, result){
            if(err){
                return next(err);
            }
            data.date = new Date();
            data.status = 'true';
            var workPoint = new workPointModel(data);
            workPoint.save(function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
        })
    };

};
module.exports = Module;