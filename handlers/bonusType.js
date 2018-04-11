var mongoose = require('mongoose');

var BonusType = function (models) {
    'use strict';

    var bonusTypeSchema = mongoose.Schemas.bonusType;

    //引入async(异步)模块
    var async = require('async');
    var pageHelper = require('../helpers/pageHelper');

    //插入数据
    this.create = function (req, res, next) {
        var BonusTypeModel = models.get(req.session.lastDb, 'bonusType', bonusTypeSchema);
        var body = req.body;
        var bonusType = new BonusTypeModel(body);

        bonusType.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });

    };

    //修改数据
    this.patchM = function (req, res, next) {
        var bonusTypeModel = models.get(req.session.lastDb, 'bonusType', bonusTypeSchema);
        var body = req.body;

        async.each(body, function (data, cb) {
            var id = data._id;

            delete data._id;
            bonusTypeModel.findByIdAndUpdate(id, {$set: data}, {new: true}, cb);
        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'updated'});
        });
    };

    //查询所有bonusType类型数据
    this.getList = function (req, res, next) {
        var bonusTypeModel = models.get(req.session.lastDb, 'bonusType', bonusTypeSchema);
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var parallelTasks;

        //返回共有多少条数据
        var getTotal = function (pCb) {

            bonusTypeModel.count(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        var getData = function (pCb) {
            bonusTypeModel.find().skip(skip).limit(limit).sort(sort).exec(function (err, _res) {
                if (err) {
                    return pCb(err);
                }

                pCb(null, _res);
            });
        };

        parallelTasks = [getTotal, getData];

        //并行且无关联，有一个流程出错就抛错
        async.parallel(parallelTasks, function (err, result) {
            var count;
            var response = {};

            if (err) {
                return next(err);
            }

            count = result[0] || 0;

            response.total = count;
            response.data = result[1];

            res.status(200).send(response);
        });

    };

    //删除单个文档
    this.remove = function (req, res, next) {
        var id = req.params._id;
        var bonusTypeModel = models.get(req.session.lastDb, 'bonusType', bonusTypeSchema);

        bonusTypeModel.findByIdAndRemove(id, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: result});
        });
    };

    //删除指定的_id的文档
    this.bulkRemove = function (req, res, next) {
        var bonusTypeModel = models.get(req.session.lastDb, 'bonusType', bonusTypeSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        bonusTypeModel.remove({_id: {$in: ids}}, function (err, removed) {
            if (err) {
                return next(err);
            }

            res.status(200).send(removed);
        });
    };

    this.getForDD = function (req, res, next) {
        var Bonus = models.get(req.session.lastDb, 'bonusType', bonusTypeSchema);

        /**
         * 这里的lean()使查询所得的结果转换为json类型
         */
        Bonus
            .find()
            .select('_id name')
            .sort({name: 1})
            .lean()
            .exec(function (err, bonusTypes) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({data: bonusTypes});
            });
    };
};

module.exports = BonusType;
