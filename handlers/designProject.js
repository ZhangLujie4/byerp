
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
        var body = req.body;
        var newProject;

        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };

        newProject = new ProjectSchema(body);


        newProject.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
        });
    };

    this.updateOnlySelectedFields = function (req, res, next) {
        var Project = models.get(req.session.lastDb, 'DesignProject', ProjectSchema);
        var data = req.body;
        var _id = req.params.id;
        var obj;
        var fileName = data.fileName;

        delete data._id;

        delete data.fileName;


        Project.findByIdAndUpdate({_id: _id}, {$set: data}, {new: true}, function (err, project) {
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
        var Project = models.get(req.session.lastDb, 'DesignProject', ProjectSchema);
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
                    from        : 'Employees',
                    localField  : 'archiveMan',
                    foreignField: '_id',
                    as          : 'archiveMan'
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
                    from        : 'Department',
                    localField  : 'designDepartment',
                    foreignField: '_id',
                    as          : 'designDepartment'
                }
            },
            {
                $lookup: {
                    from        : 'DesignBook',
                    localField  : 'DesignBookNumber',
                    foreignField: '_id',
                    as          : 'DesignBookNumber'
                }
            } ,
            {
                $project:{
                    _id                         : 1,
                    projectName                 : {$arrayElemAt:['$projectName',0]},
                    customer                    : {$arrayElemAt:['$customer', 0]},
                    designDepartment            : {$arrayElemAt:['$designDepartment',0]},
                    amount                      : 1,
                    signedDate                  : 1,
                    archDate                    : 1,
                    archiveMan                  : 1,
                    note                        : 1,
                    designContractType          : 1,
                    'createdBy.date'            : 1,
                    projectNumber               : 1,
                    DesignBookNumber            : {$arrayElemAt:['$DesignBookNumber',0]}
                }
            },
           {
                $lookup: {
                    from: 'Opportunities',
                    localField: 'DesignBookNumber.projectName',
                    foreignField: '_id',
                    as: 'BookProjectName'
                }
           },
            {
                $lookup: {
                    from        : 'Department',
                    localField  : 'DesignBookNumber.designDepartment',
                    foreignField: '_id',
                    as          : 'BookDesignDepartment'
                }
            },
            {
                $lookup: {
                    from        : 'Customers',
                    localField  : 'DesignBookNumber.customer',
                    foreignField: '_id',
                    as          : 'BookCustomer'
                }
            },
            {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'DesignBookNumber.designLeader',
                    foreignField: '_id',
                    as          : 'BookDesignLeader'
                }
            }];
        var filterMapper = new FilterMapper();

        var projectThumbPipeline = [{
            $project: {
                _id                  : 1,
                projectName          : 1,
                customer             : 1,
                designDepartment     : 1,
                designContractType   : 1,
                signedDate           : 1,
                'createdBy.date'     : 1,
                DesignBookNumber     : 1,
                BookProjectName      : {$arrayElemAt:['$BookProjectName',0]},
                BookDesignDepartment : {$arrayElemAt:['$BookDesignDepartment',0]},
                BookCustomer         : {$arrayElemAt:['$BookCustomer',0]},
                BookDesignLeader     : {$arrayElemAt:['$BookDesignLeader',0]}
            }
        }];

        var projectListPipeline = [{
            $project: {
                projectName                 : 1,
                customer                    : 1,
                designDepartment            : 1,
                amount                      : 1,
                signedDate                  : 1,
                archDate                    : 1,
                archiveMan                  : {$arrayElemAt:['$archiveMan',0]},
                note                        : 1,
                designContractType          : 1,
                'createdBy.date'            : 1,
                projectNumber               : 1,
                DesignBookNumber            : 1,
                BookProjectName             : {$arrayElemAt:['$BookProjectName',0]},
                BookDesignDepartment        : {$arrayElemAt:['$BookDesignDepartment',0]},
                BookCustomer                : {$arrayElemAt:['$BookCustomer',0]},
                BookDesignLeader            : {$arrayElemAt:['$BookDesignLeader',0]}
            }
        }];

        var projectionOptions = {
            _id                         : 1,
            projectName                 : 1,
            customer                    : 1,
            designDepartment            : 1,
            amount                      : 1,
            signedDate                  : 1,
            archDate                    : 1,
            archiveMan                  : 1,
            note                        : 1,
            designContractType          : 1,
            'createdBy.date'            : 1,
            projectNumber               : 1,
            DesignBookNumber            : 1,
            BookProjectName             : 1,
            BookDesignDepartment        : 1,
            BookCustomer                : 1,
            BookDesignLeader            : 1
        };
        var projectionLastStepOptions = {
            _id                         : '$root._id',
            projectName                 : '$root.projectName',
            customer                    : '$root.customer',
            designDepartment            : '$root.designDepartment',
            amount                      : '$root.amount',
            signedDate                  : '$root.signedDate',
            archDate                    : '$root.archDate',
            archiveMan                  : '$root.archiveMan',
            note                        : '$root.note',
            designContractType          : '$root.designContractType',
            'createdBy.date'            : '$root.createdBy.date',
            projectNumber               : '$root.projectNumber',
            DesignBookNumber            : '$root.DesignBookNumber',
            BookProjectName             : '$root.BookProjectName',
            BookDesignDepartment        : '$root.BookDesignDepartment',
            BookCustomer                : '$root.BookCustomer',
            BookDesignLeader            : '$root.BookDesignLeader',
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
            Project.aggregate(mainPipeline, function (err, result) {
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
        var Project = models.get(req.session.lastDb, 'DesignProject', ProjectSchema);

        Project.aggregate([{
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
                signedDate                     :1,
                archDate                       :1,
                archiveMan                     :1,
                note                           :1,
                designContractType             :1,
                attachments                    :1,
                DesignBookNumber               :1
            }
        }, {
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
                $lookup: {
                    from        : 'Employees',
                    localField  : 'archiveMan',
                    foreignField: '_id',
                    as          : 'archiveMan'
                }
            },
            {
                $lookup: {
                    from        : 'DesignBook',
                    localField  : 'DesignBookNumber',
                    foreignField: '_id',
                    as          : 'DesignBookNumber'
                }
            } ,
            {
                $lookup: {
                    from: 'Opportunities',
                    localField: 'projectName',
                    foreignField: '_id',
                    as: 'projectName'
                }
            },
            {
                $project: {
                    projectName                    :{$arrayElemAt: ['$projectName', 0]},
                    customer                       :{$arrayElemAt: ['$customer', 0]},
                    designDepartment               :{$arrayElemAt: ['$designDepartment', 0]},
                    projectNumber                  :1,
                    amount                         :1,
                    signedDate                     :1,
                    archDate                       :1,
                    archiveMan                     :{$arrayElemAt: ['$archiveMan', 0]},
                    note                           :1,
                    designContractType             :1,
                    attachments                    :1,
                    DesignBookNumber               :{$arrayElemAt: ['$DesignBookNumber', 0]}

                }
            },
            {
                $lookup: {
                    from: 'Opportunities',
                    localField: 'DesignBookNumber.projectName',
                    foreignField: '_id',
                    as: 'BookProjectName'
                }
            },
            {
                $lookup: {
                    from        : 'Department',
                    localField  : 'DesignBookNumber.designDepartment',
                    foreignField: '_id',
                    as          : 'BookDesignDepartment'
                }
            },
            {
                $lookup: {
                    from        : 'Customers',
                    localField  : 'DesignBookNumber.customer',
                    foreignField: '_id',
                    as          : 'BookCustomer'
                }
            },
            {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'DesignBookNumber.designLeader',
                    foreignField: '_id',
                    as          : 'BookDesignLeader'
                }
            },{
                $project: {
                    projectName                    :1,
                    designDepartment               :1,
                    projectNumber                  :1,
                    amount                         :1,
                    signedDate                     :1,
                    archDate                       :1,
                    note                           :1,
                    designContractType             :1,
                    attachments                    :1,
                    BookProjectName                :{$arrayElemAt:['$BookProjectName',0]},
                    BookDesignDepartment           :{$arrayElemAt:['$BookDesignDepartment',0]},
                    BookCustomer                   :{$arrayElemAt:['$BookCustomer',0]},
                    BookDesignLeader               :{$arrayElemAt:['$BookDesignLeader',0]},
                    DesignBookNumber               :1,
                    customer: {
                        _id     : '$customer._id',
                        fullName: {$concat: ['$customer.name.first', ' ', '$customer.name.last']}
                    },
                    archiveMan: {
                        _id     : '$archiveMan._id',
                        fullName: {$concat: ['$archiveMan.name.first', ' ', '$archiveMan.name.last']}
                    }
                }
        }]).exec(function (err, project) {
            if (err) {
                return next(err);
            }

            res.status(200).send(project[0]);
        });
    };

    this.getForDd = function (req, res, next) {
        var project = models.get(req.session.lastDb, 'DesignProject', ProjectSchema);
        var waterfallTasks;
        var accessRollSearcher = function (cb) {
            accessRoll(req, project, cb);
        };

        var contentSearcher = function (result, cb) {
            project.find({_id: {$in: result}}, {name: 1, projectShortDesc: 1,pmr:1,pmv:1})
                .lean()
                .sort({name: 1})
                .exec(function (err, _res) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, _res);
                });

        };

        waterfallTasks = [accessRollSearcher, contentSearcher];

        async.waterfall(waterfallTasks, function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send({data: result});
        });

    };

    this.remove = function (req, res, next) {
        var Project = models.get(req.session.lastDb, 'DesignProject', ProjectSchema);
        var _id = req.params.id;

        Project.findByIdAndRemove(_id, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'Remove all tasks Starting...'});
        });
    };

    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'DesignProject', ProjectSchema);
        var headers = req.headers;
        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'persons';
        var files = req.files && req.files.attachfile ? req.files.attachfile : null;
        var dir;
        var err;

        contentType = contentType.toLowerCase();
        dir = path.join(contentType, id);
        if (!files) {
            err = new Error(RESPONSES.BAD_REQUEST);
            err.status = 400;

            return next(err);
        }


        uploader.postFile(dir, files, {userId: req.session.uName}, function (err, file) {
            if (err) {
                return next(err);
            }
            Model.findByIdAndUpdate(id, {$push: {attachments: {$each: file}}}, {new: true}, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({success: 'Customers updated success', data: response});
            });
        });
    };




};

