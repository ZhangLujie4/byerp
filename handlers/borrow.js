/**
 * Created by admin on 2017/6/26.
 */
/*TODO remove caseFilter methid after testing filters*/

var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var borrowSchema = mongoose.Schemas.Borrow;
var borrowEditSchema = mongoose.Schemas.BorrowEdit;
var objectId = mongoose.Types.ObjectId;
var ProjectSchema = mongoose.Schemas.Project;
var _ = require('underscore');
var async = require('async');
var nodeScheduler = require('node-schedule');
var moment = require('../public/js/libs/moment/moment');

var Module = function (models, event) {
    'use strict';

    var validator = require('../helpers/validator');

    var fs = require('fs');
    var path = require('path');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();
    var FilterMapper = require('../helpers/filterMapper');

    this.create = function (req, res, next) {
        var borrow = models.get(req.session.lastDb, 'Borrow', borrowSchema);
        var body = req.body;
        var newborrow;
        console.log(req.session.lastDb);

        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };

        newborrow = new borrow(body);

        newborrow.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
        });
    };

    this.getPmr = function (req, res, next) {
        var query = req.query;

        getNameAndDepartment(req.session.lastDb, query, function (err, result) {
            if (err) {
                return next(err);
            }
            console.log(result);

            res.status(200).send({data: result});
        });
    };

    function getNameAndDepartment(db, query, callback) {
        var Model = models.get(db, 'Project', ProjectSchema);

        Model.aggregate([
            {
                $project: {
                    pmr: 1
                }
            },
            {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'pmr',
                    foreignField: '_id',
                    as          : 'pmr'
                }
            },
            {
                $project: {
                    pmr: {$arrayElemAt: ['$pmr', 0]},
                }
            },{
                $project: {
                    'pmr.name': {$concat: ['$pmr.name.first', ' ', '$pmr.name.last']},
                    'pmr._id'  : '$pmr._id'
                }
            },{
                $group: {
                    _id  :  null,
                    pmr      : {$addToSet: '$pmr'}
                }
            }
        ], function (err, employees) {
            if (err) {
                return callback(err);
            }

            callback(null, employees);
        });
    }

    this.getProject=function (req, res, next) {
        var data = req.query;
        var id=data.id;
        console.log(id)
        var Model = models.get(req.session.lastDb, 'Project', ProjectSchema);
        Model.aggregate([
            {
                $match: {
                    pmr: objectId(id)
                }
            },
            {
                $project: {
                    _id: 1,
                    name:1
                }
            }
        ], function (err, result) {

            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    }

    this.getByType = function (req, res, next) {
        var viewType = req.query.viewType;

        switch (viewType) {
            case 'form':
                getById(req, res, next);
                break;
            case 'list':
                getForList(req, res, next);
                break;

        }

    };

    function getById(req, res, next) {
        var data = req.query;
        var borrowInfo = models.get(req.session.lastDb, 'Borrow', borrowSchema);

        borrowInfo.findById(data.id)
            .populate('project', '_id name ')
            .populate('pmr', '_id   name ')
            .populate('createdBy.user')
            .exec(function (err, task) {
                if (err) {
                    next(err);
                }
                res.status(200).send(task);
            });

    }

    function getForList (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var bank = models.get(req.session.lastDb, 'Borrow', borrowSchema);
        sort = {'_id': 1};

        bank
            .aggregate([
                {
                    $lookup: {
                        from        : 'Users',
                        localField  : 'createdBy.user',
                        foreignField: '_id',
                        as          : 'createdBy.user'
                    }
                },{
                    $lookup: {
                        from        : 'Project',
                        localField  : 'project',
                        foreignField: '_id',
                        as          : 'project'
                    }
                },{
                    $lookup: {
                        from        : 'Employees',
                        localField  : 'pmr',
                        foreignField: '_id',
                        as          : 'pmr'
                    }
                },
                {
                    $project: {
                        _id                : 1,
                        pmr:{$arrayElemAt: ['$pmr', 0]},
                        project         : {$arrayElemAt: ['$project', 0]},
                        amount:1,
                        day       :1,
                        targetDate   :1,
                        'createdBy.user': {$arrayElemAt: ['$createdBy.user', 0]},
                        'createdBy.date': 1,
                        examine:1,
                        interest:1,
                        rate1:1,
                        rate2:1,
                        rate3:1,
                        state:1
                    }
                },
                {
                    $group: {
                        _id  : null,
                        total: {$sum: 1},
                        root : {$push: '$$ROOT'}
                    }
                },
                {
                    $unwind: '$root'
                },
                {
                    $project: {
                        _id                :'$root._id',
                        pmr:'$root.pmr',
                        'createdBy.user': '$root.createdBy.user',
                        'createdBy.date': '$root.createdBy.date',
                        project         : '$root.project',
                        amount               :'$root.amount',
                        day               :'$root.day',
                        targetDate               :'$root.targetDate',
                        examine               :'$root.examine',
                        interest               :'$root.interest',
                        rate1               :'$root.rate1',
                        rate2               :'$root.rate2',
                        rate3               :'$root.rate3',
                        state               :'$root.state',
                        total              :1
                    }
                },
                {
                    $sort: sort
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }
            ], function (err, result) {
                var count;
                var response = {};

                if (err) {
                    return next(err);
                }

                count = result[0] && result[0].total ? result[0].total : 0;

                response.total = count;
                response.data = result;
                res.status(200).send(response);
            });

    };

    this.remove = function (req, res, next) {
        var _id = req.params._id;

        var Accept = models.get(req.session.lastDb, 'Borrow', borrowSchema);
        var acceptEdit=models.get(req.session.lastDb, 'BorrowEdit', borrowEditSchema);
        var newAccept;
        Accept.findById(_id)
            .exec(function (err, accept) {
                if (err) {
                    next(err);
                }
                accept._id=null;
                accept.editNote='删除';
                accept.editedBy = {
                    date: new Date(),
                    user: req.session.uId
                };
                newAccept = new acceptEdit(accept);
                newAccept.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                });
            });

        models.get(req.session.lastDb, 'Borrow', borrowSchema).findByIdAndRemove(_id, function (err, task) {
            if (err) {
                return next(err);
            }
            res.send(200, {success: 'Success removed'});
        });
    };

    this.Update = function (req, res, next) {
        var _id = req.params._id;
        var data = req.body;
        var fileName = data.fileName;

        var Accept = models.get(req.session.lastDb, 'Borrow', borrowSchema);
        var acceptEdit=models.get(req.session.lastDb, 'BorrowEdit', borrowEditSchema);
        var newAccept;
        Accept.findById(_id)
            .exec(function (err, accept) {
                if (err) {
                    next(err);
                }
                accept._id=null;
                accept.editNote='修改';
                accept.editedBy = {
                    date: new Date(),
                    user: req.session.uId
                };
                newAccept = new acceptEdit(accept);
                newAccept.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                });
            });

        delete data._id;
        delete data.createdBy;
        delete data.fileName;

        models.get(req.session.lastDb, 'Borrow', borrowSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

            var os = require('os');
            var osType = (os.type().split('_')[0]);
            var path;
            var dir;
            var newDirname;

            if (err) {
                return next(err);
            }

            if (fileName) {
                switch (osType) {
                    case 'Windows':
                        newDirname = __dirname.replace('\\Modules', '');
                        while (newDirname.indexOf('\\') !== -1) {
                            newDirname = newDirname.replace('\\', '\/');
                        }
                        path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                        dir = newDirname + '\/uploads\/' + _id;
                        break;
                    case 'Linux':
                        newDirname = __dirname.replace('/Modules', '');
                        while (newDirname.indexOf('\\') !== -1) {
                            newDirname = newDirname.replace('\\', '\/');
                        }
                        path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                        dir = newDirname + '\/uploads\/' + _id;
                }
                fs.unlink(path, function (err) {
                    console.log(err);
                    fs.readdir(dir, function (err, files) {
                        if (files && files.length === 0) {
                            fs.rmdir(dir, function () {
                            });
                        }
                    });
                });
            }
            res.send(200, {success: 'Tasks updated', notes: result.notes, sequence: result.sequence});
        });

    };

    function scheduleRecurrenceRule(){
        nodeScheduler.scheduleJob('10 25 18 * * *', function(){

            var today=new Date();
            var month=today.getMonth();
            var borrow = models.get('CRM', 'Borrow', borrowSchema);
            borrow
                .aggregate([
                        {
                            $match: {
                                state: 'normal',
                                examine:'pass'
                            }
                        },
                        {
                            $project: {
                                _id                 : 1,
                                amount              :1,
                                rate1               :1,
                                rate2               :1,
                                rate3               :1,
                                targetDate          :1,
                                interest            :1


                            }
                        }
                    ], function (err, result) {
                        console.log(result)
                        async.map(result,function (item,cb) {
                            console.log(item)
                            var interest;
                            var rate1;
                            var rate2;
                            var rate3;
                            var data={};
                            var id=item._id;
                            if(month==1){
                                rate1=item.rate1/28;
                                rate2=item.rate1/28;
                                rate3=item.rate1/28;
                            } else{
                                rate1=item.rate1/30;
                                rate2=item.rate1/30;
                                rate3=item.rate1/30;
                            }
                            if(item.targetDate-today>0){
                                interest=item.interest*1+1*item.amount*rate1;
                            } else if(31536000000>today-item.targetDate>0){
                                interest=item.interest*1+1*item.amount*rate2;
                            } else{
                                interest=item.interest*1+1*item.amount*rate3;
                            }
                            data.interest=interest/100;
                            console.log(interest)
                            models.get('CRM', 'Borrow', borrowSchema).findByIdAndUpdate(id, {$set: data}, {new: true}, function (err, result) {

                            });
                        })
                    }

                );

        });
    };
    scheduleRecurrenceRule();

}

module.exports = Module;
