var moment = require('../public/js/libs/moment/moment');
module.exports = function (model) {
    'use strict';
    var nodeScheduler = require('node-schedule');
    var request = require('request');
    var async = require('async');
    var mongoose = require('mongoose');
    var employeeSchema = mongoose.Schemas.Employee;
    var logWriter = require('../helpers/logger');
    var crawlerResultsSchema = mongoose.Schemas.crawlerResults;
    var marketSettingsSchema = mongoose.Schemas.marketSettings;

    var rule = {
        hour  : 9,
        minute: 49
    };

　　var marketRule = new nodeScheduler.RecurrenceRule();

    marketRule.dayOfWeek = [0, new nodeScheduler.Range(1, 5)];
    marketRule.hour = [7,11, 12, 13, 14, 15, 16,22];
    marketRule.minute =37;

    function findBirthdayToday(employeesModel) {
        var now = new Date();
        var day = now.getDate();
        var month = now.getMonth() + 1;
        var matchInObject = {
            $match: {
                dateBirth: {
                    $ne: null
                }
            }
        };
        var projectObject = {
            $project: {
                day      : {$dayOfMonth: '$dateBirth'},
                month    : {$month: '$dateBirth'},
                age      : 1,
                dateBirth: 1
            }
        };
        var matchOutObject = {
            $match: {
                day: {
                    $eq: day
                },

                month: {
                    $eq: month
                }
            }
        };

        function updateBirthday(element, callback) {
            var id = element._id;
            var oldAge = element.age;
            var dateBirth = element.dateBirth;
            var age = new Date().getYear() - new Date(dateBirth).getYear();
            var update = {
                $set: {
                    age: age
                }
            };
            var options = {
                new: false
            };

            employeesModel.findByIdAndUpdate(id, update, options, function (err, result) {
                if (err) {
                    logWriter.log('Scheduler.updateBirthday findByIdAndUpdate Err ' + err);
                    console.log(err);
                }
            });
        }

        employeesModel.aggregate([matchInObject, projectObject, matchOutObject], function (err, resObject) {

            if (err) {
                logWriter.log('Scheduler.findBirthdayToday findBirthdayToday aggregate Err ' + err);
                console.log(err);
            } else if (resObject && resObject.length) {
                resObject.forEach(updateBirthday);
            } else {
                logWriter.log('Scheduler.findBirthdayToday Today No Birthday');
                console.log('Today No Birthday');
            }

        });
    }

    function updateYearEmployees(dbId) {
        return findBirthdayToday(model.get(dbId, 'Employees', employeeSchema));
    }

    function crawlerMarket(crawlerModel, marketModel){
        console.log('本次爬取时间为:' + new Date());
        var pageUrl = 'https://market.cnal.com/api/php/index.php?m=market&a=GetNewJson';
        var results = [];
        var spots = [];
        var ca = [];
        var caResults = [];
        var length = 0;
        var ids = [];

        request({uri: pageUrl}, function(err, response, body){
            console.log('crawler error: ', err);
            console.log('statusCode: ', response && response.statusCode);
            results = eval('('+body+')');
            spots = results.spot;

            marketModel.find({}, function(err, docs){
                if(err){
console.log("err=",err);
                    return cb(err);
                }
                for(var i=0; i<docs.length; i++){
                    ids[i] = docs[i].classId;
                }
console.log("ids= ", ids);
                for(var i=0; i<ids.length; i++){
                    for(var spot in spots){
                        if((spots[spot].ischecked === "1") && (parseInt(spots[spot].classid) === parseInt(ids[i]))){
                            ca[length] = spots[spot];
                            length++;
                        }
                    }
                }
console.log("ca=", ca);
                async.each(ca, function (caItem, cb) {
                    console.log(caItem.id);
                    crawlerModel.find({'id': caItem.id}, function(err, docs){
                        if(err){
                            return cb(err);
                        }

                        if(!docs.length){
                            var date = new Date(parseInt(caItem.createtime)*1000+12*60*60*1000); //12h
                            caResults.push({
                                id         : caItem.id,
                                createTime : caItem.createtime,
                                classId    : parseInt(caItem.classid),
                                dayTime    : moment(date).format('YYYYMMDD'),
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
                        crawlerModel.collection.insertMany(caResults, function (err) {
                            if (err) {
                                console.log(err);
                            }
                            console.log('已经成功爬取数据！');
                        });
                    }else{
                        console.log('没有需要爬取的数据！');
                    }
                });
            });
        });
    }

    function crawler(dbId) {
        return crawlerMarket(model.get(dbId, 'crawlerResults', crawlerResultsSchema), 
            model.get(dbId, 'marketSettings', marketSettingsSchema));
    }

    function Scheduler(dbId) {
        this.initEveryDayScheduler = function () {
            var _updateYearEmployees = updateYearEmployees.bind(this, dbId);
            var _crawler = crawler.bind(this, dbId);

            if (!process.env.INITED_SCHEDULER) {
                nodeScheduler.scheduleJob(rule, _updateYearEmployees);
                nodeScheduler.scheduleJob(marketRule, _crawler);
                process.env.INITED_SCHEDULER = true;
                console.log('=================== initEveryDayScheduler ===================');
            } else {
                logWriter.log('Scheduler.initEveryDayScheduler is inited');
                console.log('============== initEveryDayScheduler is INITED ==============');
            }
        };
    }

    return Scheduler;
};
