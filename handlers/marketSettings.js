var mongoose = require('mongoose');
var request = require('request');
var async = require('async');
var schedule = require("node-schedule");
var CONSTANTS = require('../constants/mainConstants');
var j;
var auto = false;

var Module = function (models, event) {
    'use strict';

    var marketSettingsSchema = mongoose.Schemas.marketSettings;
    var crawlerResultsSchema = mongoose.Schemas.crawlerResults;

    function crawler(req, res, next) {
        var pageUrl = 'https://market.cnal.com/api/php/index.php?m=market&a=GetNewJson';
        var crawlerResults = models.get(req.session.lastDb, 'crawlerResults', crawlerResultsSchema);
        var results = [];
        var spots = [];
        var ca = [];
        var caResults = [];
        var length = 0;
        var ids = req.query.ids;
        var mid = req.query.mid;
        request({uri: pageUrl}, function(err, response, body){
            results = eval('('+body+')');
            spots = results.spot;

            for(var i=0; i<ids.length; i++){
                for(var spot in spots){
                    if((spots[spot].ischecked === "1") && (parseInt(spots[spot].classid) === parseInt(ids[i]))){
                        ca[length] = spots[spot];
                        length++;
                    }
                }
            }

            async.each(ca, function (caItem, cb) {
                crawlerResults.find({'id': caItem.id}, function(err, docs){
                    if(err){
                        return cb(err);
                    }

                    if(!docs.length){
                        var date = new Date(caItem.createtime*1000);
                        caResults.push({
                            id         : caItem.id,
                            createTime : caItem.createtime,
                            classId    : parseInt(caItem.classid),
                            dayTime    : date.getFullYear()*10000 + date.getMonth()*100 + date.getDate() + 100,
                            minPrice   : parseFloat(caItem.min),
                            maxPrice   : parseFloat(caItem.max),
                            yAverage   : parseFloat(caItem.yaverage),
                            average    : parseFloat(caItem.average),
                            move       : parseInt(caItem.move)
                        });
                        cb(null, caResults);
                    }else{
                        cb();
                    }

                });
            }, function (err) {
                if (err) {
                    return next(err);
                }

                if(caResults.length){
                    crawlerResults.collection.insertMany(caResults, function (err) {
                        if (err) {
                            console.log(err);
                        }
                        if(!(mid === 1 || mid === 0)){
                            res.status(200).send('OK');
                        }
                        console.log('已经成功爬取数据！');
                    });
                }else{
                    if(!(mid === 1 || mid === 0)){
                        res.status(200).send('OK');
                    }
                    console.log('没有需要爬取的数据！');
                }
            });
        });
    }

    this.getByViewType = function (req, res, next) {
        var db = req.session.lastDb;
        var marketSettings = models.get(db, 'marketSettings', marketSettingsSchema);
        var result = {};

        marketSettings.aggregate([{
            $project:{
                classId : 1,
                name : 1,
                auto : 1
            }
        }, {
            $group: {
                _id  : null,
                total: {$sum: 1},
                root : {$push: '$$ROOT'}
            }
        }, {
            $unwind: '$root'
        }, {
            $project: {
                classId : '$root.classId',
                name : '$root.name',
                auto : '$root.auto',
                total : 1
            }
        }
        ],function(err,result){
            var count;
            var firstElement;
            var response = {};

            if (err) {
                return next(err);
            }

            firstElement = result[0];
            count = firstElement && firstElement.total ? firstElement.total : 0;
            response.total = count;
            response.data = result;
            res.status(200).send(response);
        });

    };

    this.crawler = function(req, res, next){
        crawler(req, res, next);
    };

    this.create = function (req, res, next) {
        var body = req.body;
        var marketSettings = models.get(req.session.lastDb, 'marketSettings', marketSettingsSchema);
        var model;
        var err;

        model = new marketSettings(body);

        marketSettings.find({'classId': body.classId}, function(err, docs){
            if(err){
                return cb(err);
            }

            if(!docs.length){
                model.save(function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    res.status(200).send({message: 'New marketSettings is created'});
                });
            }

        });

    };

    this.autoSettings = function(req, res, next){
        var marketSettings = models.get(req.session.lastDb, 'marketSettings', marketSettingsSchema);
        var mid = parseInt(req.query.mid);
        var ids = [];

        if(mid === 1){
            auto = true;
            j = schedule.scheduleJob('30 * * * * *', function(){
                console.log('本次爬取时间为:' + new Date());
                marketSettings.find({auto:true}, function(err, docs){
                    if(err){
                        return cb(err);
                    }
                    for(var i=0; i<docs.length; i++){
                        ids[i] = docs[i].classId;
                    }
                    req.query.ids = ids;
                    req.query.mid = mid;
                    crawler(req, res, next);
                });
            });
            res.status(200).send('OK');
        }else if(mid === 0){
            auto = false;
            j.cancel();
            res.status(200).send('OK');
        }else{
            res.status(200).send(auto);
        }
    };

    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'marketSettings', marketSettingsSchema);
        var body = req.body || {ids: []};
        var deleteHistory = req.query.deleteHistory;
        var ids = body.ids;

        Model.remove({classId: {$in: ids}}, function (err, removed) {
            if (err) {
                return next(err);
            }
            if (deleteHistory) {
                historyWriter.deleteHistoryById(req, {contentId: {$in: ids}});
            }

            res.status(200).send(removed);
        });
    };

    this.getForDd = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'marketSettings', marketSettingsSchema);

        Model.find({}, {name: 1, classId: 1})
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({data: result});
            });
    };

    this.getAluminumPrice = function(req, res, next) {
        var db = req.session.lastDb;
        var crawlerResults = models.get(db, 'crawlerResults', crawlerResultsSchema);

        crawlerResults.find()
            .sort('dayTime')
            .exec(function (err, results) {
                if (err) {
                    return next(err);
                }

		if (results.length) {
                    async.map(results, function (aluminum, cb) {
                        var alum = {
                            _id : aluminum._id,
                            id : aluminum.id,
                            name : CONSTANTS.CNAL[aluminum.classId],
                            classId : aluminum.classId,
                            minPrice : aluminum.minPrice,
                            maxPrice : aluminum.maxPrice,
                            yAverage : aluminum.yAverage,
                            average : aluminum.average,
                            move : aluminum.move,
                            isCrawler : aluminum.isCrawler,
                            dayTime : aluminum.dayTime,
                            createTime : aluminum.createTime
                        };
                        cb(null, alum);
                    }, function (err, aluminums) {
                        if (err) {
                            return next(err);
                        }

                        var response = {};
                        response.total = aluminums.length;
                        response.data = aluminums;
                        res.status(200).send(response);
                    });
                }else{
                    res.status(200).send([]);
                }
            });
    };

    this.createAluminumPrice = function(req, res, next) {
        var body = req.body;
        var crawlerResults = models.get(req.session.lastDb, 'crawlerResults', crawlerResultsSchema);
        var model;
        var err;

        model = new crawlerResults(body);

        model.save(function (err, result) {
            if (err) {
                return cb(err);
            }
            res.status(200).send({message: 'New crawlerResults is created'});
        });
    };

    this.bulkRemoveAluminumPrice = function (req, res, next) {
        var db = req.session.lastDb;
        var Model = models.get(db, 'crawlerResults', crawlerResultsSchema);
        var body = req.body || {ids: []};
        var deleteHistory = req.query.deleteHistory;
        var ids = body.ids;

        Model.find({_id: {$in: ids}},function(err, results) {
            if(err){
                return next(err);
            }

            var _ids = [];

            for(var i=0; i<results.length; i++){
                if(!results[i].isCrawler){
                    _ids.push(results[i]._id);
                }
            }

            if(_ids.length){
                Model.remove({_id: {$in: _ids}}, function (err, removed) {
                    if (err) {
                        return next(err);
                    }
                    if (deleteHistory) {
                        historyWriter.deleteHistoryById(req, {contentId: {$in: ids}});
                    }

                    res.status(200).send(removed);
                });
            }else{
                console.log("您需要删除的数据都不是手动添加，因此不可删除！");
                res.status(200).send("您需要删除的数据都不是手动添加，因此不可删除！");
            }
        });
    };

};

module.exports = Module;
