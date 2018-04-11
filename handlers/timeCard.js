var mongoose = require('mongoose');
var xlsx = require("node-xlsx");
var moment = require('../public/js/libs/moment/moment');
var async = require('async');
var _ = require('lodash');
var objectId = mongoose.Types.ObjectId;

var tcardSchema =  mongoose.Schemas.timeCard;
var attendanceSchema = mongoose.Schemas.attendance;
var empInfoSchema = mongoose.Schemas.empInfo;
var employeeSchema = mongoose.Schemas.employee;
var holidaySchema = mongoose.Schemas.Holiday;

var exporter = require('../helpers/exporter/exportDecorator');
var exportMap = require('../helpers/csvMap').timeCard;
var FilterMapper = require('../helpers/filterMapper');
var pageHelper = require('../helpers/pageHelper');

var ASummer1 = {start: '00:00:00', end: '08:00:59'};   // normal punch in
var ASummer2 = {start: '08:01:00', end: '12:00:00'};   // later in
var ASummer3 = {start: '12:00:01', end: '17:29:59'};   // early out
var ASummer4 = {start: '17:30:00', end: '23:59:59'};   // normal punch out
var BSummer1 = {start: '07:30:00', end: '08:00:59'};
var BSummer2 = {start: '08:01:00', end: '12:00:00'};
var BSummer3 = {start: '12:00:01', end: '17:29:59'};
var BSummer4 = {start: '17:30:00', end: '18:00:00'};
var CSummer1 = {start: '07:00:00', end: '07:30:59'};  // normal punch in
var CSummer2 = {start: '07:31:00', end: '09:30:00'};  // later in
var CSummer3 = {start: '09:30:01', end: '11:29:59'};  // early out
var CSummer4 = {start: '11:30:00', end: '12:00:00'};  // normal punch out
var CSummer5 = {start: '13:00:00', end: '13:30:59'};  // worker pm start
var CSummer6 = {start: '13:31:00', end: '15:30:00'};  // later
var CSummer7 = {start: '15:30:01', end: '16:59:59'};  // early
var CSummer8 = {start: '17:00:00', end: '17:30:00'};  // worker pm end
var CSummer9 = {start: '17:30:00', end: '18:00:59'};  // overtime begin
var CSummer10 = {start: '18:00:00', end: '21:45:00'};  // overtime end
var DSummer1 = {start: '07:00:00', end: '23:00:59'};

var Module = function (models) {
    'use strict';

    // var missionAllowanceSchema = mongoose.Schemas.missionAllowance;
    // var sequenceSchema = mongoose.Schemas.sequence;
    // var objectId = mongoose.Types.ObjectId;

    this.getForView = function (req, res, next) {
        var timeCard = models.get(req.session.lastDb, 'timeCard', tcardSchema);
        var holiday = models.get(req.session.lastDb, 'holiday', holidaySchema);
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;

        var filterObj = {};
        var optionsObject = {};
        var filter = data.filter || {};
        var contentType = data.contentType || 'timeCard';
        var filterMapper = new FilterMapper();
        var empid = filter.name?filter.name.value:[];
        var departId = filter.department?filter.department.value: [];
        var type = filter.type?filter.type.value: null;
        empid = _.map(empid, x => parseInt(x));
        departId = _.map(departId, x => objectId(x));
        if(empid.length){
            optionsObject.empid = {$in: empid};
        }
        if(departId.length){
            optionsObject['department._id'] = {$in: departId};
        }
        if(type){
          optionsObject['department.externalId'] = type;
        }

        var queryObject = {};
        
        if(filter.name || filter.department || data.type){
          queryObject.$and = [];
          queryObject.$and.push(optionsObject);
        }

        if (data.year && data.month) {
            queryObject.year = parseInt(data.year);
            queryObject.month = parseInt(data.month);
        }
        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'year': -1, 'month': -1, 'day': -1, 'empid': -1};
        }

        timeCard.aggregate([
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
              empid: 1,
              name: 1,
              employee: 1,
              department: {$arrayElemAt: ['$department', 0]},
              year: 1,
              month: 1,
              day: 1,
              _type: 1,
              rate: 1,
              otrate: 1,
              lateram: 1,
              earlyam: 1,
              laterpm: 1,
              earlypm: 1
            }
          },
          {
            $project: {
              empid: 1,
              name: 1,
              employee: 1,
              'department.name': '$department.name',
              'department._id': '$department._id',
              'department.externalId': '$department.externalId',
              year: 1,
              month: 1,
              day: 1,
              _type: 1,
              rate: 1,
              otrate: 1,
              lateram: 1,
              earlyam: 1,
              laterpm: 1,
              earlypm: 1
            }
          },
          {
            $match: queryObject
          }
          ],function(err, result){
            if(err){
              return next(err);
            }
            var total = [];
            async.each(result, function(item, asyncCb){
              var year = item.year;
              var month = item.month;
              var day = item.day;
              var empid = item.empid;
              var name = item.name;
              var employee = item.employee;
              var department = item.department;
              var rate = item.rate;
              var _type = item._type;
              var otrate = item.otrate;
              var flag = false;
              for(var i=0; i<total.length; i++){
                if(total[i].year == year && total[i].month == month && total[i].empid == empid){
                  total[i].rate[day-1] = rate;
                  total[i].type[day-1] = _type;
                  total[i].otrate[day-1] = otrate;
                  flag = true;
                }
              }
              if(!flag){
                var dataItem = {
                  year: year,
                  month: month,
                  empid: empid,
                  name: name,
                  employee: employee,
                  department: department
                };
                dataItem.rate = [];
                dataItem.type = [];
                dataItem.otrate = [];
                dataItem.rate[day-1] = rate;
                dataItem.type[day-1] = _type;
                dataItem.otrate[day-1] = otrate;
                total.push(dataItem);
              }
              asyncCb();
            }, function(err){
              if(err){
                next(err);
              }
              res.status(200).send(total);
            })

        });

    };

    this.getById = function(req, res, next){
        var timeCard =models.get(req.session.lastDb, 'timeCard', tcardSchema);
        var id = req.query.id;
        var filterYear = parseInt(req.query.year || new Date().getFullYear());

        timeCard.aggregate([
          {
            $match: {
              employee: objectId(id),
              year: filterYear
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
              empid: 1,
              name: 1,
              employee: 1,
              department: {$arrayElemAt: ['$department', 0]},
              year: 1,
              month: 1,
              day: 1,
              _type: 1,
              rate: 1,
              otrate: 1,
              lateram: 1,
              earlyam: 1,
              laterpm: 1,
              earlypm: 1
            }
          },
          {
            $project: {
              empid: 1,
              name: 1,
              employee: 1,
              'department._id': '$department._id',
              'department.name': '$department.name',
              'department.externalId': '$department.externalId',
              year: 1,
              month: 1,
              day: 1,
              _type: 1,
              rate: 1,
              otrate: 1,
              lateram: 1,
              earlyam: 1,
              laterpm: 1,
              earlypm: 1
            }
          }
          // {
          //   $match: queryObject
          // }
          ],function(err, result){
            if(err){
              return next(err);
            }

            var total = [];
            async.each(result, function(item, asyncCb){
              var year = item.year;
              var month = item.month;
              var day = item.day;
              var empid = item.empid;
              var name = item.name;
              var employee = item.employee;
              var department = item.department;
              var rate = item.rate;
              var _type = item._type;
              var otrate = item.otrate;
              var flag = false;
              for(var i=0; i<total.length; i++){
                if(total[i].year == year && total[i].month == month){
                  total[i].rate[day-1] = rate;
                  total[i].type[day-1] = _type;
                  total[i].otrate[day-1] = otrate;
                  flag = true;
                }
              }
              if(!flag){
                var dataItem = {
                  year: year,
                  month: month,
                  empid: empid,
                  name: name,
                  employee: employee,
                  department: department,
                };
                dataItem.rate = [];
                dataItem.type = [];
                dataItem.otrate = [];
                dataItem.rate[day-1] = rate;
                dataItem.type[day-1] = _type;
                dataItem.otrate[day-1] = otrate;
                total.push(dataItem);
              }
              asyncCb();
            }, function(err){
              if(err){
                next(err);
              }
              res.status(200).send(total);
            })
            
        });
    };

    this.getMonthData = function(req, res, next){
        var timeCard = models.get(req.session.lastDb, 'timeCard', tcardSchema);
        var id = req.params.id;
        var datekey = parseInt(id.substring(0, 6));
        var empid = id.substring(6);

        timeCard.aggregate([
          {
            $match: {
              employee: objectId(empid)
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
              name: 1,
              empid: 1,
              employee: 1,
              year: 1,
              month: 1,
              day: 1,
              amin: 1,
              amout: 1,
              pmin: 1,
              pmout: 1,
              otin: 1,
              otout: 1,
              _type: 1,
              rate: 1,
              department: {$arrayElemAt: ['$department', 0]}
            }
          },
          {
            $project: {
              name: 1,
              empid: 1,
              employee: 1,
              year: 1,
              month: 1,
              day: 1,
              amin: 1,
              amout: 1,
              pmin: 1,
              pmout: 1,
              otin: 1,
              otout: 1,
              _type: 1,
              rate: 1,
              datekey: {$add: [{$multiply: ['$year', 100]}, '$month']},
              'department.externalId': '$department.externalId'
            }
          },
          {
            $match: {
              datekey: datekey
            }
          }
          ],function(err,result) {
            if(err){
              return next(err);
            }
            var response = {
              data: result
            }
            res.status(200).send(response);
        })
        
    };

    this.importFile = function(req, res, next){
        var timeCard = models.get(req.session.lastDb, 'timeCard', tcardSchema );
        var data = req.body;
        var file = req.files && req.files.file ? req.files.file : null;
        var userId = req.session.uId;
        var list = xlsx.parse(file.path);
        var xlsData = []; 
        var date = [];

        async.eachSeries(list, function(sheet, cb){
            if(sheet.data.length != 0){
                sheet.data.shift();
            }
            async.eachSeries(sheet.data, function(item, asyncCb){
                var seq=item[0];
                var name = item[2];
                var empid = parseInt(item[3]);
                var rawdt = item[4];
                var pdt = new Date(1900, 0, rawdt - 1);
                
                var deptid = item[5];
                var machineid = item[7];
                var punchitem = {punchtime: pdt, empid: empid, name:name};
                if(seq != 'NULL'){
                    dealRecord(req, punchitem, asyncCb);
                }else{
                    asyncCb();
                }
            }, function(err){
                if(err){
                    return cb(err);
                }
                cb()
            })
        }, function(err){
            if(err){
                next(err);
            }
            processData(req, function(err){
              if(err){
                next(err);
              }
              res.status(200).send('success');
            })
            
        })
    };

    function dealRecord(req, item, cb) {
      // parse punch record
      var timeCard = models.get(req.session.lastDb, 'timeCard', tcardSchema);
      var cmptime=item.punchtime;
      item.H = cmptime.getHours();
      item.M = cmptime.getMinutes();
      var year = cmptime.getFullYear();
      var month = cmptime.getMonth()+ 1;
      var day = cmptime.getDate();
      cmptime = moment(new Date(cmptime));
      
      var query = {
        'year': year,
        'month': month,
        'day': day,
        'empid': item.empid
      };

      var update = {};
      
      timeCard.findOne(query, function(err, tcard) {
        if (tcard==null) {
                // no exists, add one 12:00 17:30
            var arr;
            if(item.H<12){
                arr = new timeCard({year: year, month: month, day: day, empid: item.empid, name: item.name, amin: cmptime.format(), amout: cmptime.format()});
                arr.save(function(error, docs) {
                  if(error){
                    console.log(error); 
                  }
                  console.log("one amrecord added");
                  cb();
                });
            }
            else if(item.H<=17 && item.M<30){
                arr = new timeCard({year: year, month: month, day: day, empid: item.empid, name: item.name, pmin: cmptime.format(), pmout: cmptime.format()});
                arr.save(function(error, docs) {
                  if(error){
                    console.log(error); 
                  }
                  console.log("one pmrecord added");
                  cb();
                });
            }

            else if(item.H<24){
                arr = new timeCard({year: year, month: month, day: day, empid: item.empid, name: item.name, otin: cmptime.format(), otout: cmptime.format()});
                arr.save(function(error, docs) {
                  if(error){
                    console.log(error); 
                  }
                  console.log("one otrecord added");
                  cb();
                });
            }
                
        } else {
          var flag=false;
          var t1=moment(tcard.amin);
          var t2=moment(tcard.amout);
          var t3=moment(tcard.pmin);
          var t4=moment(tcard.pmout);
          var t5=moment(tcard.otin);
          var t6=moment(tcard.otout);
          if(!tcard.amin && !tcard.amout && item.H<12){
            update.amin=cmptime.format();
            update.amout=cmptime.format();
            flag=true;
          }

          else if(!tcard.pmin && !tcard.pmout && item.H>=12 && item.H<=17 && item.M<30){
            update.pmin=cmptime.format();
            update.pmout=cmptime.format();
            flag=true;
          }

          else if(!tcard.otin && !tcard.otout && item.H>=17 && item.M>=30 && item.H<24){
            update.otin=cmptime.format();
            update.otout=cmptime.format();
            flag=true;
          }
          if(!flag){
            if (item.H<12) {  // am;
              if (cmptime.isBefore(t1)) {
                update['amin']=cmptime.format();
              } else if (cmptime.isAfter(t2)) {
                update['amout']=cmptime.format();
              } else {
                update.amout=cmptime.format();
              }
            } else if (item.H<=17 && item.M<30) {
              if (cmptime.isBefore(t3)) {
                update['pmin']=cmptime.format();
              } else if (cmptime.isAfter(t4)) {
                update['pmout']=cmptime.format();
              }else {
                update.pmin=cmptime.format();
                update.pmout=cmptime.format();
              }
            } else if (item.H<24) {
              if (cmptime.isBefore(t5)) {
                update['otin']=cmptime.format();
              } else if (cmptime.isAfter(t6)) {
                update['otout']=cmptime.format();
              }else {
                update.otin=cmptime.format();
                update.otout=cmptime.format();
              }
            }
          }
          
          var options = {};
          console.log(JSON.stringify(update));
          timeCard.update(query, update, options, function(err, timecards) {
            if(err){
              console.log(err);
              cb();
            }
            if (timecards) {
                cb();
            }
          });
        }
      });
      
    };

    function processData(req, callback){
      var timeCard = models.get(req.session.lastDb, 'timeCard', tcardSchema);
      var datekey = req.params.datekey;
      console.log(datekey);
      var year = parseInt(datekey.toString().substr(0, 4));
      var month = parseInt(datekey.toString().substr(4, 2));
      console.log(year, month);
      timeCard.aggregate([
        {
          $match: {
            year: year,
            month: month
          }
        },
        {
          $project: {
            empid: 1,
            name: 1,
            employee: 1,
            department: 1,
            year: 1,
            month: 1,
            day: 1,
            amin: 1,
            amout: 1,
            pmin: 1,
            pmout: 1,
            otin: 1,
            otout: 1
          }
        }
        ],function(err, result){
          if(err){
            console.log(err);
          }
          async.eachSeries(result, function(item, cb){
            deal(req, item, cb);
          },function(err){
            if(err){
              callback(err);
            }

            console.log('数据处理完成');
            callback(null);
          })
      })
    }

    function deal(req, punchitem ,callback) {
        var empInfo = models.get(req.session.lastDb, 'empInfo', empInfoSchema);
        var attendance = models.get(req.session.lastDb, 'attendance', attendanceSchema);
        var timeCard = models.get(req.session.lastDb, 'timeCard', tcardSchema);
        var holiday = models.get(req.session.lastDb, 'Holiday', holidaySchema);
        var year = punchitem.year;
        var month = punchitem.month;  // !!
        var day = punchitem.day;
        var date = new Date();
        date.setFullYear(year, month-1, day);
        var name = punchitem.name;
        var empid = punchitem.empid;
        var amin = transferDate(punchitem.amin || '');
        var amout = transferDate(punchitem.amout || '');
        var pmin = transferDate(punchitem.pmin || '');
        var pmout = transferDate(punchitem.pmout || '');
        var otin = transferDate(punchitem.otin || '');
        var otout = transferDate(punchitem.otout || '');
        var lateram = 0;
        var earlyam = 0;
        var laterpm = 0;
        var earlypm = 0;

        function getTypeByDepId(cb) {
          empInfo.aggregate([
            {
              $match: {
                effecDate: {$lte: date},
                attenNo: empid
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
                type: 1,
                effecDate: 1,
                employee: {$arrayElemAt: ['$employee', 0]},
              }
            },
            {
              $project: {
                type: 1,
                effecDate: 1,
                employee: '$employee._id',
                department: '$employee.department'
              }
            },
            {
              $sort: {
                effecDate: -1
              }
            }
            ],function(err, result){
              if(err){
                return cb(err);
              }
              var data = {};
              if(!result.length){
                data.type = 'C';
                data.employee = null;
                data.department = null;
                cb(null, data);
              }
              else{
                data.type = result[0].type;
                data.employee = result[0].employee;
                data.department = result[0].department || null;
                cb(null, data);
              }
          });
        };

        function generate(data, cb){
          // get attendance type from deptid
          // parse punch record 
          var flag1=0;
          var flag2=0;
          var _type="";
          var rate=1;
          var otrate=0.5;
          var type = data.type;
          var employee = data.employee;
          var department = data.department;
          if(type == "A"){
            //late or early
            if (isBetween(amin, ASummer2.start, ASummer2.end)) {
                flag1 ++;
                lateram = getDiff(amin, ASummer2.start); 
            } else
            if (isBetween(pmout, ASummer3.start, ASummer3.end) && otout=='') {
                flag2 ++;
                earlypm = getDiff(pmout, ASummer3.end);
            }
            //not punch
            if(amin == ''){
              rate -= 0.5;
            }
            if(pmout == '' && otout == ''){
              rate -= 0.5;
            }
            otrate=0;
          }
          else if(type == "C"){
            //late or early
            if (isBetween(amin, CSummer2.start, CSummer2.end)) {
                flag1++;
                lateram = getDiff(amin, CSummer2.start);
            } else
            if (isBetween(amout, CSummer3.start, CSummer3.end)) {
                flag2++;
                earlyam = getDiff(amout, CSummer3.end);
            } else
            if (isBetween(pmin, CSummer6.start, CSummer6.end)) {
                flag1++;
                laterpm = getDiff(pmin, CSummer6.start);
            } else
            if (isBetween(pmout, CSummer7.start, CSummer7.end)) {
                flag2++;
                earlypm = getDiff(pmout, CSummer7.end);
            }

            //not punch
            if(amin == '' || getDiff(amin, amout)< 10){
              rate -= 0.5;
            }
            if(pmin == '' || getDiff(pmin, pmout)< 10){
              rate -= 0.5;
            }
            if(otin == '' || getDiff(otin, otout)< 10){
              otrate -= 0.5;
            }
          }
          else if(type == "D"){
            if(isBetween(rectime, Dsummer1.start, Dsummer1.end)){
                update1 = rectime;
                _type = 'ordinary';
                flag = 1;
            }
            else{
                update2 = rectime;
                _type = 'ordinary';
                flag = 6;
            }
          }

          var query = {
              'year': year,
              'month': month,
              'empid': punchitem.empid,
              'employee': employee
          };
          var update = {
              $inc: {late: flag1, early: flag2}
          };
          var attendInfo = {
            lateram: lateram,
            earlyam: earlyam,
            laterpm: laterpm,
            earlypm: earlypm,
            rate: rate,
            otrate:otrate,
            employee: employee,
            department: department
          };
          if(flag1>0 && flag2==0){
            attendInfo._type = 'late';
          }
          else if(flag1==0 && flag2>0){
            attendInfo._type = 'early';
          }
          else if(flag1>0 && flag2>0){
            attendInfo._type = 'both';
          }

          holiday.aggregate([
            {
              $project: {
                year: 1,
                date: 1,
                type: 1
              }
            },
            {
              $project: {
                year: 1,
                month: {$month: '$date'},
                day: {$dayOfMonth: '$date'},
                type: 1
              }
            },
            {
              $match: {
                year: year,
                month: month,
                day: day,
                type: type
              }
            }
          ], function(err, result){
            if(err){
              cb(err);
            }
            if(result.length){
              attendInfo.rate = attendInfo.rate*10;
            }
            attendance.find(query, function(err, timecards) {
                if (err) {
                    console.log("error: " + err);
                    cb(err);
                } else {
                    if(!timecards.length){
                      query.late = flag1;
                      query.early = flag2;
                      query.name = name;
                      var puch = new attendance(query);
                      puch.save(function(err, result){
                        if(err){
                          cb(err);
                        }
                        cb(null, attendInfo);
                      })
                    }
                    else{
                      attendance.findOneAndUpdate(query, update, function(err, reuslt){
                        if(err){
                          console.log(err);
                          cb(err);
                        }
                        cb(null, attendInfo);
                      })
                    }
                }
            });
          })
          
        };

        function updateTimeCard(attendInfo, cb){
          timeCard.findByIdAndUpdate(punchitem._id, attendInfo, function(err, result){
            if(err){
              return cb(err);
            }
            cb();
          })
        };

        async.waterfall([getTypeByDepId, generate, updateTimeCard], function(err, result){
          if(err){
            console.log(err);
            callback(err);
          }
          callback();
        })

    };

    function transferDate(date){
      if(date == ''){
        return date;
      }
      else{
        var newdate = moment(new Date(date)).format('HH:mm:ss');
        return newdate;
      }
    }
    function isBetween(needle, str1, str2) {
        if(needle == ''){
          return false;
        }
        if (needle >= str1 && needle <= str2) {
            return true;
        }
        return false;
    }

    function getDiff(time1, time2){
      if(time1>time2)
      {
        var x = time1;
        time1 = time2;
        time2 = x;
      }

      var min1=parseInt(time1.substr(0,2))*60+parseInt(time1.substr(3,2));
      var min2=parseInt(time2.substr(0,2))*60+parseInt(time2.substr(3,2));

      var n=min2-min1;

      return n;
    }


    this.exportToXlsx = function (req, res, next) {
        var dbName = req.session.lastDb;
        var Model = models.get(dbName, 'timeCard', tcardSchema);

        var filter = req.query.filter ? JSON.parse(req.query.filter) : JSON.stringify({});
        var type = 'timeCard';
        var filterObj = {};
        var options;
        var filterMapper = new FilterMapper();

        if (filter && typeof filter === 'object') {
            filterObj = filterMapper.mapFilter(filter, {contentType: 'timeCard'});
        }

        options = {
            res         : res,
            next        : next,
            Model       : Model,
            map         : exportMap,
            returnResult: true,
            fileName    : type
        };

        function lookupForEmployee(cb) {
            var query = [];
            var i;

            query.push({$match: {}});

            var aggregate = [{
              $project: {
                empid: 1,
                name: 1,
                year: 1,
                month: 1,
                day: 1,
                amin: 1,
                amout: 1,
                pmin: 1,
                pmout: 1,
                otin: 1,
                otout: 1,
                earlyam: 1,
                earlypm: 1,
                lateram: 1,
                laterpm: 1,
                rate: 1,
                otrate: 1,
                _type: 1
              }
            }]
            for (i = 0; i < aggregate.length; i++) {
                query.push(aggregate[i]);
            }

            query.push({$match: filterObj});

            options.query = query;
            options.cb = cb;

            exporter.exportToXlsx(options);
        }

        async.parallel([lookupForEmployee], function (err, result) {
            var resultArray = result[0];

            exporter.exportToXlsx({
                res        : res,
                next       : next,
                Model      : Model,
                resultArray: resultArray,
                map        : exportMap,
                fileName   : type
            });
        });

    };


};
module.exports = Module;