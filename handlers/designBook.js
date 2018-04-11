module.exports = function (models, event) {
    'use strict';

    var FilterMapper = require('../helpers/filterMapper');
    var mongoose = require('mongoose');
    var RESPONSES = require('../constants/responses');
    var accessRoll = require('../helpers/accessRollHelper.js')(models);
    var _ = require('../node_modules/underscore');
    var moment = require('../public/js/libs/moment/moment');
    var async = require('async');
    var CONSTANTS = require('../constants/mainConstants.js');
    var Mailer = require('../helpers/mailer');
    var Uploader = require('../services/fileStorage/index');

    var fs = require('fs');
    var path = require('path');
    var ProjectSchema = mongoose.Schemas.DesignProject;
    var DesignBookSchema = mongoose.Schemas.DesignBook;
    var objectId = mongoose.Types.ObjectId;
    var uploader = new Uploader();

    var exporter = require('../helpers/exporter/exportDecorator');


    function pageHelper(data) {
        var count = data.count;
        var page = data.page || 1;
        var skip;

        count = parseInt(count, 10);
        count = !isNaN(count) ? count : CONSTANTS.COUNT_PER_PAGE;
        page = parseInt(page, 10);
        page = !isNaN(page) && page ? page : 1;
        skip = (page - 1) * count;

        return {
            skip : skip,
            limit: count
        };
    }

    this.create = function (req, res, next) {
        var ProjectSchema = models.get(req.session.lastDb, 'DesignProject', ProjectSchema);
        var BookSchema=models.get(req.session.lastDb, 'DesignBook', DesignBookSchema);
        var body = req.body;
        var newProject;
        var newBook;

        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };

        newBook = new BookSchema(body);


        newBook.save(function (err, result) {
            if (err) {
                return next(err);
            }

            var DesignBookNumber=result._id;
            var data={
                DesignBookNumber     :DesignBookNumber,
                designContractType   :body.designContractType,
                createdBy            :body.createdBy,
                name                 :body.name
            };
            newProject=new ProjectSchema(data);

            newProject.save(function (err,result) {
                res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
            })


        });
    };

    this.updateOnlySelectedFields = function (req, res, next) {
        var Book = models.get(req.session.lastDb, 'DesignBook', DesignBookSchema);
        var data = req.body;
        var _id = req.params.id;
        var obj;
        var fileName = data.fileName;

        delete data._id;

        delete data.fileName;


        Book.findByIdAndUpdate({_id: _id}, {$set: data}, {new: true}, function (err, project) {
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

            res.status(200).send(project);
        });
    };

    this.getByViewType = function (req, res, next) {
        var Book = models.get(req.session.lastDb, 'DesignBook', DesignBookSchema);
        var data = req.query;
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var sort = data.sort || {'createdBy.date': -1};
        var viewType = data.viewType;
        var optionsObject;
        var filter = data.filter || {};
        var response = {};
        var lookupPipeline = [
            {
                $lookup: {
                    from        : 'Customers',
                    localField  : 'customer',
                    foreignField: '_id',
                    as          : 'customer'
                }
            },
            {
                $lookup: {
                    from: 'Opportunities',
                    localField: 'projectName',
                    foreignField: '_id',
                    as: 'projectName'
                }
            },
            {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'designLeader',
                    foreignField: '_id',
                    as          : 'designLeader'
                }
            },
            {
                $lookup: {
                    from        : 'Department',
                    localField  : 'designDepartment',
                    foreignField: '_id',
                    as          : 'designDepartment'
                }
            }];
        var filterMapper = new FilterMapper();

        var projectThumbPipeline = [{
            $project: {
                _id                  : 1,
                projectName          : {$arrayElemAt:['$projectName',0]},
                customer             : {$arrayElemAt:['$customer', 0]},
                designLeader         : {$arrayElemAt:['$designLeader',0]},
                designDepartment     : {$arrayElemAt:['$designDepartment',0]},
                designContractType   : 1,
                designDate           : 1,
                'createdBy.date'     : 1
            }
        }];

        var projectListPipeline = [{
            $project: {
                projectName                 : {$arrayElemAt:['$projectName',0]},
                customer                    : {$arrayElemAt:['$customer', 0]},
                designDepartment            : {$arrayElemAt:['$designDepartment',0]},
                amount                      : 1,
                designDate                  : 1,
                designContractType          : 1,
                designLeader                : {$arrayElemAt:['$designLeader',0]},
                expenseDepartment           : 1,
                otherDepartment             : 1,
                invoiceAccountReceivable    : 1,
                accountReceived             : 1,
                accountReceivable           : 1,
                designRequire               : 1,
                designType                  : 1,
                'createdBy.date'            : 1,
                projectNumber               : 1
            }
        }];

        var projectionOptions = {
            _id                         : 1,
            projectName                 : 1,
            customer                    : 1,
            designDepartment            : 1,
            amount                      : 1,
            designDate                  : 1,
            designContractType          : 1,
            designLeader                : 1,
            expenseDepartment           : 1,
            otherDepartment             : 1,
            invoiceAccountReceivable    : 1,
            accountReceived             : 1,
            accountReceivable           : 1,
            designRequire               : 1,
            designType                  : 1,
            'createdBy.date'            : 1,
            projectNumber               : 1
        };
        var projectionLastStepOptions = {
            _id                         : '$root._id',
            projectName                 : '$root.projectName',
            customer                    : '$root.customer',
            designDepartment            : '$root.designDepartment',
            amount                      : '$root.amount',
            designDate                  : '$root.designDate',
            designContractType          : '$root.designContractType',
            designLeader                : '$root.designLeader',
            expenseDepartment           : '$root.expenseDepartment',
            otherDepartment             : '$root.otherDepartment',
            invoiceAccountReceivable    : '$root.invoiceAccountReceivable',
            accountReceived             : '$root.accountReceived',
            accountReceivable           : '$root.accountReceivable',
            designRequire               : '$root.designRequire',
            designType                  : '$root.designType',
            'createdBy.date'            : '$root.createdBy.date',
            projectNumber               : '$root.projectNumber',
            total                       : 1
        };
        var keysSort = Object.keys(sort);
        var sortLength = keysSort.length - 1;
        var sortKey;
        var waterfallTasks;
        var contentSearcher;
        var mainPipeline;
        var i;

        if (viewType === 'list') {
            mainPipeline = lookupPipeline.concat(projectListPipeline);
        } else if (viewType === 'thumbnails') {
            mainPipeline = lookupPipeline.concat(projectThumbPipeline);
        }

        for (i = 0; i <= sortLength; i++) {
            sortKey = keysSort[i];
            sort[sortKey] = parseInt(sort[sortKey], 10);
        }

        if (filter && typeof filter === 'object') {
            optionsObject = filterMapper.mapFilter(filter, 'DesignProjects'); // caseFilter(filter);
        }



        contentSearcher = function ( cb) {
            var queryObject = {};

            queryObject.$and = [];

            if (optionsObject) {
                queryObject.$and.push(optionsObject);
            }
            mainPipeline.push(
                {
                    $match: queryObject
                },
                {
                    $project: projectionOptions
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
                    $project: projectionLastStepOptions
                },
                {
                    $sort: sort
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                });
            Book.aggregate(mainPipeline, function (err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, result);
            });
        };

        waterfallTasks = [contentSearcher];

        async.waterfall(waterfallTasks, function (err, result) {
            var count;
            var firstElement;

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

    this.getById = function (req, res, next) {
        var id = req.params.id;
        var Book = models.get(req.session.lastDb, 'DesignBook', DesignBookSchema);

        Book.aggregate([{
            $match: {
                _id: objectId(id)
            }
        }, {
            $project: {
                projectName                    :1,
                customer                       :1,
                designDepartment               :1,
                projectNumber                  :1,
                amount                         :1,
                designDate                     :1,
                designContractType             :1,
                designLeader                   :1,
                expenseDepartment              :1,
                otherDepartment                :1,
                invoiceAccountReceivable       :1,
                accountReceived                :1,
                accountReceivable              :1,
                designType                     :1,
                designRequire                  :1
            }
        },
            {
                $lookup: {
                    from: 'Opportunities',
                    localField: 'projectName',
                    foreignField: '_id',
                    as: 'projectName'
                }
            },{
            $lookup: {
                from        : 'Department',
                localField  : 'designDepartment',
                foreignField: '_id',
                as          : 'designDepartment'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'customer',
                foreignField: '_id',
                as          : 'customer'
            }
        },
            {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'designLeader',
                    foreignField: '_id',
                    as          : 'designLeader'
                }
            },
            {
                $project: {
                    projectName                    :{$arrayElemAt:['$projectName',0]},
                    customer                       :{$arrayElemAt: ['$customer', 0]},
                    designDepartment               :{$arrayElemAt: ['$designDepartment', 0]},
                    projectNumber                  :1,
                    amount                         :1,
                    designDate                     :1,
                    designContractType             :1,
                    designLeader                   :{$arrayElemAt: ['$designLeader', 0]},
                    expenseDepartment              :1,
                    otherDepartment                :1,
                    invoiceAccountReceivable       :1,
                    accountReceived                :1,
                    accountReceivable              :1,
                    designType                     :1,
                    designRequire                  :1

                }
            }, {
                $project: {
                    projectName                    :1,
                    designDepartment               :1,
                    projectNumber                  :1,
                    amount                         :1,
                    designDate                     :1,
                    designContractType             :1,
                    expenseDepartment              :1,
                    otherDepartment                :1,
                    invoiceAccountReceivable       :1,
                    accountReceived                :1,
                    accountReceivable              :1,
                    designType                     :1,
                    designRequire                  :1,
                    customer: {
                        _id     : '$customer._id',
                        fullName: {$concat: ['$customer.name.first', ' ', '$customer.name.last']}
                    },
                    designLeader: {
                        _id     : '$designLeader._id',
                        fullName: {$concat: ['$designLeader.name.first', ' ', '$designLeader.name.last']}
                    }
                }
            }]).exec(function (err, project) {
            if (err) {
                return next(err);
            }

            res.status(200).send(project[0]);
        });
    };

    this.remove = function (req, res, next) {
        var Book = models.get(req.session.lastDb, 'DesignBook', DesignBookSchema);
        var Project=models.get(req.session.lastDb,'DesignProject',ProjectSchema);
        var _id = req.params.id;

        Book.findByIdAndRemove(_id, function (err) {
            if (err) {
                return next(err);
            }
            Project
                .aggregate([
                    {
                        $match:{
                            DesignBookNumber:objectId(_id)
                        }
                    },
                    {
                        $project: {

                            _id:1

                        }
                    }
                ],function (err,result) {
                    if(result.length) {
                        var projectId = result[0]._id;
                        Project.findByIdAndRemove(projectId, function (err) {
                            if (err) {
                                return next(err);
                            }
                            res.status(200).send({success: 'Remove all tasks Starting...'});
                        })
                    }else{
                        res.status(200).send({success: 'Remove all tasks Starting...'});
                    }
                })

        });
    };

    this.getProject=function (req,res,next) {
        var Project=models.get(req.session.lastDb,'DesignProject',ProjectSchema);
        var data=req.query;
        var bookId=data.id;

        Project
            .aggregate([
                {
                    $match:{
                        DesignBookNumber:objectId(bookId)
                    }
                },
                {
                    $project:{
                        _id:1
                    }
                }
            ],function (err,result) {
                res.status(200).send({projectId:result})
            })
    }




};

