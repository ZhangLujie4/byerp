/*  TODO agregation validate for empty names    */
var Filters = function (models) {
    'use strict';

    var mongoose = require('mongoose');
    var _ = require('../node_modules/underscore');
    var objectId = mongoose.Types.ObjectId;
    var async = require('async');
    var CONSTANTS = require('../constants/mainConstants.js');
    var moment = require('../public/js/libs/moment/moment');
    var FILTER_CONSTANTS = require('../public/js/constants/filters');

    this.getProjectsDashboardFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var ProjectSchema = mongoose.Schemas.Project;
        var jobsSchema = mongoose.Schemas.jobs;
        var Project = models.get(lastDB, 'Project', ProjectSchema);
        var Jobs = models.get(lastDB, 'jobs', jobsSchema);
        var pipeLine;
        var aggregation;
        var pipeLineJobs;

        pipeLineJobs = [{
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                workflow: {$arrayElemAt: ['$workflow', 0]},
                type    : 1
            }
        }, {
            $group: {
                _id: null,

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },

                type: {
                    $addToSet: {
                        _id : '$type',
                        name: '$type'
                    }
                }
            }
        }];

        pipeLine = [{
            $lookup: {
                from        : 'Customers',
                localField  : 'customer',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $project: {
                name    : 1,
                customer: {$arrayElemAt: ['$customer', 0]}
            }
        }, {
            $group: {
                _id: null,

                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: {$concat: ['$customer.name.first', ' ', '$customer.name.last']}
                    }
                },

                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$name'
                    }
                }
            }
        }];

        aggregation = Project.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            Jobs.aggregate(pipeLineJobs, function (err, jobs) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(jobs.length ? _.extend(result, jobs[0]) : result);
            });
        });
    };

    this.getContarctJobsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var jobsSchema = mongoose.Schemas.jobs;
        var Jobs = models.get(lastDB, 'jobs', jobsSchema);
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $project: {
                name           : 1,
                project        : {$arrayElemAt: ['$project', 0]},
                workflow       : {$arrayElemAt: ['$workflow', 0]},
                customer       : {$arrayElemAt: ['$customer', 0]},
                projectManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {
                            $and: [{
                                $eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.PROJECTSMANAGER)]
                            }]
                        }
                    }
                },

                salesManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {
                            $and: [{
                                $eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]
                            }]
                        }
                    }
                }
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'project.customer',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $project: {
                project        : 1,
                workflow       : 1,
                customer       : {$arrayElemAt: ['$customer', 0]},
                projectManagers: 1,
                salesManagers  : 1
            }
        }, {
            $unwind: {
                path                      : '$projectManagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $unwind: {
                path                      : '$salesManagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesManagers.employeeId',
                foreignField: '_id',
                as          : 'salesManager'
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'projectManagers.employeeId',
                foreignField: '_id',
                as          : 'projectManager'
            }
        }, {
            $project: {
                project       : 1,
                workflow      : 1,
                customer      : 1,
                projectManager: {$arrayElemAt: ['$projectManager', 0]},
                salesManager  : {$arrayElemAt: ['$salesManager', 0]}
            }
        }, {
            $project: {
                project     : 1,
                workflow    : 1,
                customer    : 1,
                salesManager: {
                    _id : '$salesManager._id',
                    name: {
                        $concat: ['$salesManager.name.first', ' ', '$salesManager.name.last']
                    }
                },

                projectManager: {
                    _id : '$projectManager._id',
                    name: {
                        $concat: ['$projectManager.name.first', ' ', '$projectManager.name.last']
                    }
                }
            }
        }, {
            $group: {
                _id: null,

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },

                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: {
                            $concat: ['$customer.name.first', ' ', '$customer.name.last']
                        }
                    }
                },

                projectManager: {
                    $addToSet: {
                        _id: {
                            $cond: {
                                if  : {$eq: ['$projectManager.name', null]},
                                then: 'null',
                                else: '$projectManager._id'
                            }
                        },

                        name: {
                            $cond: {
                                if  : {$eq: ['$projectManager.name', null]},
                                then: 'Empty',
                                else: '$projectManager.name'
                            }
                        }
                    }
                },

                salesManager: {
                    $addToSet: {
                        _id: {
                            $cond: {
                                if  : {$eq: ['$salesManager.name', null]},
                                then: 'null',
                                else: '$salesManager._id'
                            }
                        },

                        name: {
                            $cond: {
                                if  : {$eq: ['$salesManager.name', null]},
                                then: 'Empty',
                                else: '$salesManager.name'
                            }
                        }
                    }
                },

                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: '$project.name'
                    }
                }
            }
        }
        ];

        aggregation = Jobs.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getEmployeesFilters = function (req, res, next) {
        var query = {isEmployee: true}; // = req.query ? req.query.filter || req.query : {};
        var lastDB = req.session.lastDb;
        var EmployeeSchema = mongoose.Schemas.Employee;
        var Employee = models.get(lastDB, 'Employee', EmployeeSchema);
        var pipeLine;
        var aggregation;

        pipeLine = [
            {
                $match: query
            }, {
                $lookup: {
                    from        : 'Department',
                    localField  : 'department',
                    foreignField: '_id',
                    as          : 'department'
                }
            }, {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'manager',
                    foreignField: '_id',
                    as          : 'manager'
                }
            }, {
                $lookup: {
                    from        : 'JobPosition',
                    localField  : 'jobPosition',
                    foreignField: '_id',
                    as          : 'jobPosition'
                }
            }, {
                $project: {
                    department : {$arrayElemAt: ['$department', 0]},
                    manager    : {$arrayElemAt: ['$manager', 0]},
                    jobPosition: {$arrayElemAt: ['$jobPosition', 0]},
                    name       : 1
                }
            }, {
                $project: {
                    department    : 1,
                    'manager._id' : 1,
                    'manager.name': {
                        $concat: ['$manager.name.first', ' ', '$manager.name.last']
                    },

                    jobPosition: 1,
                    name       : {
                        $concat: ['$name.first', ' ', '$name.last']
                    }
                }
            }, {
                $group: {
                    _id        : null,
                    name       : {
                        $addToSet: {
                            _id : '$_id',
                            name: {$ifNull: ['$name', 'None']}
                        }
                    },
                    department : {
                        $addToSet: {
                            _id : '$department._id',
                            name: {$ifNull: ['$department.name', 'None']}
                        }
                    },
                    jobPosition: {
                        $addToSet: {
                            _id : '$jobPosition._id',
                            name: {
                                $ifNull: ['$jobPosition.name', 'None']
                            }
                        }
                    },
                    manager    : {
                        $addToSet: {
                            _id : '$manager._id',
                            name: {
                                $ifNull: ['$manager.name', 'None']
                            }
                        }
                    }
                }
            }];

        aggregation = Employee.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getDealsTasksFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var TaskSchema = mongoose.Schemas.DealTasks;
        var Task = models.get(lastDB, 'DealTasks', TaskSchema);
        var pipeLine;
        var aggregation;
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $lookup: {
                from        : 'Employees',
                localField  : 'assignedTo',
                foreignField: '_id',
                as          : 'assignedTo'
            }
        }, {
            $lookup: {
                from        : 'Opportunities',
                localField  : 'deal',
                foreignField: '_id',
                as          : 'deal'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        },
            {
                $lookup: {
                    from        : 'tags',
                    localField  : 'category',
                    foreignField: '_id',
                    as          : 'category'
                }
            }, {
                $project: {
                    description: 1,
                    workflow   : {$arrayElemAt: ['$workflow', 0]},
                    assignedTo : {$arrayElemAt: ['$assignedTo', 0]},
                    deal       : {$arrayElemAt: ['$deal', 0]},
                    category   : {$arrayElemAt: ['$category', 0]}
                }
            }, {
                $group: {
                    _id     : null,
                    deal    : {
                        $addToSet: {
                            _id : '$deal._id',
                            name: {$ifNull: ['$deal.name', '']}
                        }
                    },
                    category: {
                        $addToSet: {
                            _id : '$category._id',
                            name: {$ifNull: ['$category.name', '']}
                        }
                    },
                    name    : {
                        $addToSet: {
                            _id : '$_id',
                            name: '$description'
                        }
                    },

                    assignedTo: {
                        $addToSet: {
                            _id : '$assignedTo._id',
                            name: {
                                $ifNull: [{
                                    $concat: ['$assignedTo.name.first', ' ', '$assignedTo.name.last']
                                }, 'None']
                            }
                        }
                    },

                    workflow: {
                        $addToSet: {
                            _id : '$workflow._id',
                            name: {
                                $ifNull: ['$workflow.name', 'None']
                            }
                        }
                    }
                }
            }, {
                $project: {
                    deal      : {
                        $filter: {
                            input: '$deal',
                            as   : 'element',
                            cond : notNullQuery
                        }
                    },
                    category  : {
                        $filter: {
                            input: '$category',
                            as   : 'element',
                            cond : notNullQuery
                        }
                    },
                    name      : {
                        $filter: {
                            input: '$name',
                            as   : 'element',
                            cond : notNullQuery
                        }
                    },
                    assignedTo: {
                        $filter: {
                            input: '$assignedTo',
                            as   : 'element',
                            cond : notNullQuery
                        }
                    },
                    workflow  : {
                        $filter: {
                            input: '$workflow',
                            as   : 'element',
                            cond : notNullQuery
                        }
                    }
                }
            }];

        aggregation = Task.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getPersonFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var CustomerSchema = mongoose.Schemas.Customer;
        var Customer = models.get(lastDB, 'Customers', CustomerSchema);
        var aggregation;
        var pipeLine;
        var query = {type: 'Person'};

        pipeLine = [{
            $match: query
        }, {
            $project: {
                _id    : '$_id',
                name   : {$concat: ['$name.first', ' ', '$name.last']},
                address: '$address'
            }
        }, {
            $group: {
                _id: null,

                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: {
                            $cond: {
                                if  : {
                                    $eq: ['$name', ' ']
                                },
                                then: 'None',
                                else: '$name'
                            }
                        }
                    }
                },

                country: {
                    $addToSet: {
                        _id : {
                            $cond: {
                                if  : {
                                    $eq: ['$address.country', '']
                                },
                                then: 'None',
                                else: {$ifNull: ['$address.country', 'None']}
                            }
                        },
                        name: {
                            $cond: {
                                if  : {
                                    $eq: ['$address.country', '']
                                },
                                then: 'None',
                                else: {$ifNull: ['$address.country', 'None']}
                            }
                        }
                    }
                }
            }
        }];

        aggregation = Customer.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                result = result.length ? result[0] : {};

                result.services = [
                    {
                        name: 'Supplier',
                        _id : 'isSupplier'
                    }, {
                        name: 'Customer',
                        _id : 'isCustomer'
                    }];

                res.status(200).send(result);
            }
        );
    };

    this.getCompaniesFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var CustomerSchema = mongoose.Schemas.Customer;
        var Customer = models.get(lastDB, 'Customers', CustomerSchema);
        var aggregation;
        var pipeLine;
        var query = {type: 'Company'};
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $match: query
        }, {
            $project: {
                _id    : '$_id',
                name   : {$concat: ['$name.first', ' ', '$name.last']},
                address: '$address'
            }
        }, {
            $group: {
                _id: null,

                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: {
                            $cond: {
                                if  : {
                                    $eq: ['$name', ' ']
                                },
                                then: 'None',
                                else: '$name'
                            }
                        }
                    }
                },

                country: {
                    $addToSet: {
                        _id : '$address.country',
                        name: {$ifNull: ['$address.country', 'None']}
                    }
                }
            }
        }, {
            $project: {
                country: {
                    $filter: {
                        input: '$country',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                name   : {
                    $filter: {
                        input: '$name',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = Customer.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            result.services = [
                {
                    name: 'Supplier',
                    _id : 'isSupplier'
                }, {
                    name: 'Customer',
                    _id : 'isCustomer'
                }];

            res.status(200).send(result);
        });
    };

    this.getApplicationFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var EmployeeSchema = mongoose.Schemas.Employee;
        var Employee = models.get(lastDB, 'Employee', EmployeeSchema);
        var query = {isEmployee: false};
        var pipeLine;
        var aggregation;

        pipeLine = [
            {
                $match: query
            }, {
                $lookup: {
                    from        : 'Department',
                    localField  : 'department',
                    foreignField: '_id',
                    as          : 'department'
                }
            }, {
                $lookup: {
                    from        : 'JobPosition',
                    localField  : 'jobPosition',
                    foreignField: '_id',
                    as          : 'jobPosition'
                }
            }, {
                $project: {
                    department : {$arrayElemAt: ['$department', 0]},
                    jobPosition: {$arrayElemAt: ['$jobPosition', 0]},
                    name       : 1
                }
            }, {
                $project: {
                    department : 1,
                    jobPosition: 1,
                    name       : {
                        $concat: ['$name.first', ' ', '$name.last']
                    }
                }
            }, {
                $group: {
                    _id: null,

                    name: {
                        $addToSet: {
                            _id : '$_id',
                            name: {$ifNull: ['$name', 'None']}
                        }
                    },

                    department: {
                        $addToSet: {
                            _id : '$department._id',
                            name: {$ifNull: ['$department.name', 'None']}
                        }
                    },

                    jobPosition: {
                        $addToSet: {
                            _id : '$jobPosition._id',
                            name: {
                                $ifNull: ['$jobPosition.name', 'None']
                            }
                        }
                    }
                }
            }];

        aggregation = Employee.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getProjectFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var ProjectSchema = mongoose.Schemas.Project;
        var Project = models.get(lastDB, 'Project', ProjectSchema);
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $lookup: {
                from        : 'Customers',
                localField  : 'customer',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : '_id',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $project: {
                name           : 1,
                workflow       : {$arrayElemAt: ['$workflow', 0]},
                customer       : {$arrayElemAt: ['$customer', 0]},
                projectManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {
                            $and: [{
                                $eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.PROJECTSMANAGER)]
                            }]
                        }
                    }
                },

                salesManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {
                            $and: [{
                                $eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]
                            }]
                        }
                    }
                }
            }
        }, {
            $unwind: {
                path                      : '$projectManagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $unwind: {
                path                      : '$salesManagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesManagers.employeeId',
                foreignField: '_id',
                as          : 'salesManager'
            }
        }, {
            $project: {
                name           : 1,
                workflow       : 1,
                customer       : 1,
                projectManagers: 1,
                salesManager   : {$arrayElemAt: ['$salesManager', 0]}
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'projectManagers.employeeId',
                foreignField: '_id',
                as          : 'projectManager'
            }
        }, {
            $project: {
                name    : 1,
                workflow: 1,
                customer: 1,

                salesManager: {
                    _id : {$ifNull: ['$salesManager._id', 'None']},
                    name: {$concat: ['$salesManager.name.first', ' ', '$salesManager.name.last']}
                },

                projectManager: {$arrayElemAt: ['$projectManager', 0]}
            }
        }, {
            $project: {
                name          : 1,
                workflow      : 1,
                customer      : 1,
                salesManager  : 1,
                projectManager: {
                    _id : {$ifNull: ['$projectManager._id', 'None']},
                    name: {$concat: ['$projectManager.name.first', ' ', '$projectManager.name.last']}
                }
            }
        }, {
            $group: {
                _id: null,

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },

                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: {$concat: ['$customer.name.first', ' ', '$customer.name.last']}
                    }
                },

                projectManager: {
                    $addToSet: {
                        _id : '$projectManager._id',
                        name: {$ifNull: ['$projectManager.name', 'Empty']}
                    }
                },

                salesManager: {
                    $addToSet: {
                        _id : '$salesManager._id',
                        name: {$ifNull: ['$salesManager.name', 'Empty']}
                    }
                },

                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$name'
                    }
                }
            }
        }];

        aggregation = Project.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getTasksFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var TaskSchema = mongoose.Schemas.Task;
        var Task = models.get(lastDB, 'Task', TaskSchema);
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $lookup: {
                from        : 'Project',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'assignedTo',
                foreignField: '_id',
                as          : 'assignedTo'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                summary   : 1,
                type      : 1,
                workflow  : {$arrayElemAt: ['$workflow', 0]},
                assignedTo: {$arrayElemAt: ['$assignedTo', 0]},
                project   : {$arrayElemAt: ['$project', 0]}
            }
        }, {
            $group: {
                _id    : null,
                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: '$project.name'
                    }
                },

                summary: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$summary'
                    }
                },

                assignedTo: {
                    $addToSet: {
                        _id : '$assignedTo._id',
                        name: {
                            $ifNull: [{
                                $concat: ['$assignedTo.name.first', ' ', '$assignedTo.name.last']
                            }, 'None']
                        }
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: {
                            $ifNull: ['$workflow.name', 'None']
                        }
                    }
                },

                type: {
                    $addToSet: {
                        _id : '$type',
                        name: '$type'
                    }
                }
            }
        }];

        aggregation = Task.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getInvoiceFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var purchaseInvoicesSchema = mongoose.Schemas.purchaseInvoices;
        var Model = models.get(lastDB, 'purchaseInvoices', purchaseInvoicesSchema);
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $match: {
                forSales: false,
                _type   : 'purchaseInvoices'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                workflow: {$arrayElemAt: ['$workflow', 0]},
                supplier: {$arrayElemAt: ['$supplier', 0]}
            }
        }, {
            $group: {
                _id     : null,
                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },
                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                }
            }
        }];

        aggregation = Model.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getSalesInvoiceFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var wTrackInvoiceSchema = mongoose.Schemas.wTrackInvoice;
        var wTrackInvoice = models.get(lastDB, 'wTrackInvoice', wTrackInvoiceSchema);
        var pipeLine;
        var aggregation;
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $match: {
                forSales: true,
                _type   : 'wTrackInvoice'
            }
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                workflow: {$arrayElemAt: ['$workflow', 0]},
                supplier: {$arrayElemAt: ['$supplier', 0]},
                project : {$arrayElemAt: ['$project', 0]},

                salesManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]}
                    }
                }
            }
        }, {
            $unwind: {
                path                      : '$salesManagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesManagers.employeeId',
                foreignField: '_id',
                as          : 'salesManagers'
            }
        }, {
            $project: {
                workflow     : 1,
                supplier     : 1,
                salesManagers: {$arrayElemAt: ['$salesManagers', 0]},
                project      : 1
            }
        }, {
            $group: {
                _id     : null,
                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: {$ifNull: ['$workflow.name', '']}
                    }
                },

                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: {$ifNull: ['$project.name', '']}
                    }
                },

                salesPerson: {
                    $addToSet: {
                        _id : '$salesManagers._id',
                        name: {
                            $concat: ['$salesManagers.name.first', ' ', '$salesManagers.name.last']
                        }
                    }
                },

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {$concat: ['$supplier.name.first', ' ', '$supplier.name.last']}
                    }
                }
            }
        }, {
            $project: {
                salesPerson: {
                    $filter: {
                        input: '$salesPerson',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                supplier   : {
                    $filter: {
                        input: '$supplier',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                project    : {
                    $filter: {
                        input: '$project',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                workflow   : {
                    $filter: {
                        input: '$workflow',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = wTrackInvoice.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getSalesInvoicesFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var InvoiceSchema = mongoose.Schemas.Invoices;
        var Proforma = models.get(lastDB, 'Invoices', InvoiceSchema);
        var pipeLine;
        var aggregation;
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $match: {
                forSales: true,
                _type   : 'Invoices'
            }
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesPerson',
                foreignField: '_id',
                as          : 'salesPerson'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                workflow     : {$arrayElemAt: ['$workflow', 0]},
                supplier     : {$arrayElemAt: ['$supplier', 0]},
                project      : {$arrayElemAt: ['$project', 0]},
                salesManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]}
                    }
                }
            }
        }, {
            $unwind: {
                path                      : '$salesManagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesManagers.employeeId',
                foreignField: '_id',
                as          : 'salesManagers'
            }
        }, {
            $project: {
                workflow     : 1,
                supplier     : 1,
                salesManagers: {$arrayElemAt: ['$salesManagers', 0]},
                project      : 1
            }
        }, {
            $group: {
                _id: null,

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },

                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: {$ifNull: ['$project.name', '']}
                    }
                },

                salesPerson: {
                    $addToSet: {
                        _id : '$salesManagers._id',
                        name: {
                            $concat: ['$salesManagers.name.first', ' ', '$salesManagers.name.last']
                        }
                    }
                },

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                }
            }
        }, {
            $project: {
                salesPerson: {
                    $filter: {
                        input: '$salesPerson',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                supplier   : {
                    $filter: {
                        input: '$supplier',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                project    : {
                    $filter: {
                        input: '$project',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                workflow   : {
                    $filter: {
                        input: '$workflow',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = Proforma.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getCustomerPaymentsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var customerPaymentsSchema = mongoose.Schemas.Payment;
        var customerPayments = models.get(lastDB, 'Payment', customerPaymentsSchema);
        var query = {forSale: true};
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'Invoice',
                localField  : 'invoice',
                foreignField: '_id',
                as          : 'invoice'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $lookup: {
                from        : 'PaymentMethod',
                localField  : 'paymentMethod',
                foreignField: '_id',
                as          : 'paymentMethod'
            }
        }, {
            $project: {
                supplier     : {$arrayElemAt: ['$supplier', 0]},
                invoice      : {$arrayElemAt: ['$invoice', 0]},
                paymentMethod: {$arrayElemAt: ['$paymentMethod', 0]},
                name         : 1
            }
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'invoice.project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $project: {
                supplier     : 1,
                salesmanagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]}
                    }
                },
                name         : 1,
                paymentMethod: 1
            }
        }, {
            $unwind: {
                path                      : '$salesmanagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesmanagers.employeeId',
                foreignField: '_id',
                as          : 'salesmanagers'
            }
        }, {
            $project: {
                supplier     : 1,
                salesmanager : {$arrayElemAt: ['$salesmanagers', 0]},
                paymentMethod: 1,
                name         : 1
            }
        }, {
            $group: {
                _id     : null,
                assigned: {
                    $addToSet: {
                        _id : '$salesmanager._id',
                        name: {
                            $concat: ['$salesmanager.name.first', ' ', '$salesmanager.name.last']
                        }
                    }
                },

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                },

                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$name'
                    }
                },

                paymentMethod: {
                    $addToSet: {
                        _id : '$paymentMethod._id',
                        name: '$paymentMethod.name'
                    }
                }
            }
        }];

        aggregation = customerPayments.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };
    this.getPurchasePaymentsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var PaymentsSchema = mongoose.Schemas.purchasePayments;
        var Payments = models.get(lastDB, 'purchasePayments', PaymentsSchema);
        var query = {forSale: false};
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'Invoice',
                localField  : 'invoice',
                foreignField: '_id',
                as          : 'invoice'
            }
        }, {
            $lookup: {
                from        : 'Order',
                localField  : 'order',
                foreignField: '_id',
                as          : 'order'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $lookup: {
                from        : 'PaymentMethod',
                localField  : 'paymentMethod',
                foreignField: '_id',
                as          : 'paymentMethod'
            }
        }, {
            $project: {
                supplier     : {$arrayElemAt: ['$supplier', 0]},
                invoice      : {$arrayElemAt: ['$invoice', 0]},
                order        : {$arrayElemAt: ['$order', 0]},
                paymentMethod: {$arrayElemAt: ['$paymentMethod', 0]},
                name         : 1
            }
        }, {
            $project: {
                salesPerson  : {$ifNull: ['$invoice.salesPerson', '$order.salesPerson']},
                paymentMethod: 1,
                supplier     : 1,
                name         : 1
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesPerson',
                foreignField: '_id',
                as          : 'salesPerson'
            }
        }, {
            $project: {
                paymentMethod: 1,
                supplier     : 1,
                name         : 1,
                salesPerson  : {$arrayElemAt: ['$salesPerson', 0]}
            }
        }, {
            $group: {
                _id     : null,
                assigned: {
                    $addToSet: {
                        _id : '$salesPerson._id',
                        name: {
                            $concat: ['$salesPerson.name.first', ' ', '$salesPerson.name.last']
                        }
                    }
                },

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                },

                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$name'
                    }
                },

                paymentMethod: {
                    $addToSet: {
                        _id : '$paymentMethod._id',
                        name: '$paymentMethod.name'
                    }
                }
            }
        }];

        aggregation = Payments.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            result.refund = [
                {
                    name: 'true',
                    _id : 'true'
                }, {
                    name: 'false',
                    _id : 'false'
                }];

            //result.filterInfo = FILTER_CONSTANTS.purchasePayments;
            res.status(200).send(result);
        });
    };

    this.getSupplierPaymentsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var customerPaymentsSchema = mongoose.Schemas.Payment;
        var customerPayments = models.get(lastDB, 'Payment', customerPaymentsSchema);
        var query = {
            forSale: false,
            bonus  : true
        };
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                supplier  : {$arrayElemAt: ['$supplier', 0]},
                paymentRef: 1,
                year      : 1,
                month     : 1,
                workflow  : 1
            }
        }, {
            $project: {
                supplier  : 1,
                paymentRef: 1,
                year      : 1,
                month     : 1,
                workflow  : 1
            }
        }, {
            $group: {
                _id: null,

                supplier: {
                    $addToSet: {
                        _id: '$supplier._id',

                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        },

                        isEmployee: '$supplier.isEmployee'
                    }
                },

                paymentRef: {
                    $addToSet: {
                        _id : '$paymentRef',
                        name: {
                            $ifNull: ['$paymentRef', 'None']
                        }
                    }
                },

                year: {
                    $addToSet: {
                        _id : '$year',
                        name: {
                            $ifNull: ['$year', 'None']
                        }
                    }
                },

                month: {
                    $addToSet: {
                        _id : '$month',
                        name: {
                            $ifNull: ['$month', 'None']
                        }
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow',
                        name: {
                            $ifNull: ['$workflow', 'None']
                        }
                    }
                }
            }
        }];

        aggregation = customerPayments.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getProductsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var ProductSchema = mongoose.Schemas.Products;
        var Product = models.get(lastDB, 'Products', ProductSchema);
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $group: {
                _id: null,

                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$name'
                    }
                }/*,

                 productType: {
                 $addToSet: {
                 _id : '$info.productType',
                 name: {
                 $ifNull: ['$info.productType', 'None']
                 }
                 }
                 }*/
            }
        }];

        aggregation = Product.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};
            result.hasJob = [
                {
                    name: 'True',
                    _id : 'True'
                }
            ];

            result.canBePurchased = [
                {
                    name: 'True',
                    _id : 'true'
                },
                {
                    name: 'False',
                    _id : 'false'
                }
            ];

            result.canBeSold = [
                {
                    name: 'True',
                    _id : 'true'
                },
                {
                    name: 'False',
                    _id : 'false'
                }
            ];

            result.canBeExpensed = [
                {
                    name: 'True',
                    _id : 'true'
                },
                {
                    name: 'False',
                    _id : 'false'
                }
            ];

            res.status(200).send(result);
        });
    };

    this.getQuotationFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var QuotationSchema = mongoose.Schemas.Quotation;
        var Quotation = models.get(lastDB, 'Quotation', QuotationSchema);
        var pipeLine;
        var aggregation;
        var query = {
            forSales: false,
            isOrder : false
        };
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                workflow: {$arrayElemAt: ['$workflow', 0]},
                supplier: {$arrayElemAt: ['$supplier', 0]}
            }
        }, {
            $group: {
                _id     : null,
                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                }
            }
        }, {
            $project: {
                supplier: {
                    $filter: {
                        input: '$supplier',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                workflow: {
                    $filter: {
                        input: '$workflow',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = Quotation.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getSalesQuotationFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var QuotationSchema = mongoose.Schemas.Quotation;
        var Quotation = models.get(lastDB, 'Quotation', QuotationSchema);
        var pipeLine;
        var aggregation;
        var query = {
            forSales: true,
            isOrder : false
        };

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                workflow     : {$arrayElemAt: ['$workflow', 0]},
                project      : {$arrayElemAt: ['$project', 0]},
                supplier     : {$arrayElemAt: ['$supplier', 0]},
                salesmanagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]}
                    }
                }
            }
        }, {
            $unwind: {
                path                      : '$salesmanagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesmanagers.employeeId',
                foreignField: '_id',
                as          : 'salesmanager'
            }
        }, {
            $project: {
                workflow    : 1,
                project     : 1,
                supplier    : 1,
                salesmanager: {$arrayElemAt: ['$salesmanager', 0]}
            }
        }, {
            $project: {
                workflow    : 1,
                project     : 1,
                supplier    : 1,
                salesmanager: {
                    _id : {$ifNull: ['$salesmanager._id', 'None']},
                    name: {
                        $concat: ['$salesmanager.name.first', ' ', '$salesmanager.name.last']
                    }
                }
            }
        }, {
            $group: {
                _id: null,

                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: '$project.name'
                    }
                },

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                },

                salesManager: {
                    $addToSet: {
                        _id : '$salesmanager._id',
                        name: {$ifNull: ['$salesmanager.name', 'Empty']}
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                }
            }
        }];

        aggregation = Quotation.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };
    this.getOrderFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var OrderSchema = mongoose.Schemas.Order;
        var Order = models.get(lastDB, 'Order', OrderSchema);
        var pipeLine;
        var aggregation;
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        var salesManagerMatch = {
            $and: [
                {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]},
                {
                    $or: [{
                        $and: [{
                            $eq: ['$$projectMember.startDate', null]
                        }, {
                            $eq: ['$$projectMember.endDate', null]
                        }]
                    }, {
                        $and: [{
                            $lte: ['$$projectMember.startDate', '$orderDate']
                        }, {
                            $eq: ['$$projectMember.endDate', null]
                        }]
                    }, {
                        $and: [{
                            $eq: ['$$projectMember.startDate', null]
                        }, {
                            $gte: ['$$projectMember.endDate', '$orderDate']
                        }]
                    }, {
                        $and: [{
                            $lte: ['$$projectMember.startDate', '$orderDate']
                        }, {
                            $gte: ['$$projectMember.endDate', '$orderDate']
                        }]
                    }]
                }]
        };

        pipeLine = [
	{
	    $match: {
		orderType: 'salesOrder'
  	    }
	},
	{
            $lookup: {
                from        : 'Employees',
                localField  : 'salesPerson',
                foreignField: '_id',
                as          : 'salesPerson'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $lookup: {
                from        : 'integrations',
                localField  : 'channel',
                foreignField: '_id',
                as          : 'channel'
            }
        }, {
            $project: {
                workflow     : {$arrayElemAt: ['$workflow', 0]},
                supplier     : {$arrayElemAt: ['$supplier', 0]},
                channel      : {$arrayElemAt: ['$channel', 0]},
                salesManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : salesManagerMatch
                    }
                },

                salesPerson: {$arrayElemAt: ['$salesPerson', 0]},
                status     : 1,
                name       : 1
            }
        }, {
            $project: {
                salesManager: {$arrayElemAt: ['$salesManagers', 0]},
                workflow    : 1,
                channel     : 1,
                supplier    : 1,
                salesPerson : 1,
                status      : 1,
                name        : 1
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesManager.employeeId',
                foreignField: '_id',
                as          : 'salesManager'
            }
        }, {
            $project: {
                salesPerson: {$ifNull: ['$salesPerson', {$arrayElemAt: ['$salesManager', 0]}]},
                workflow   : 1,
                channel    : 1,
                supplier   : 1,
                status     : 1,
                name       : 1
            }
        }, {
            $group: {
                _id     : null,

                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$name'
                    }
                },

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                },

                salesPerson: {
                    $addToSet: {
                        _id : '$salesPerson._id',
                        name: {
                            $concat: ['$salesPerson.name.first', ' ', '$salesPerson.name.last']
                        }
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: {$ifNull: ['$workflow.name', '']}
                    }
                },

                allocationStatus: {
                    $addToSet: {
                        _id : '$status.allocateStatus',
                        name: {
                            $cond: {
                                if  : {$eq: ['$status.allocateStatus', 'ALL']}, then: {$literal: 'Allocated all'},
                                else: {
                                    $cond: {
                                        if  : {$eq: ['$status.allocateStatus', 'NOA']},
                                        then: {$literal: 'Partially allocated'}, else: {$literal: 'Not allocated'}
                                    }
                                }
                            }

                        }
                    }
                },

                fulfilledStatus: {
                    $addToSet: {
                        _id : '$status.fulfillStatus',
                        name: {
                            $cond: {
                                if  : {$eq: ['$status.fulfillStatus', 'ALL']}, then: {$literal: 'Fulfilled all'},
                                else: {
                                    $cond: {
                                        if  : {$eq: ['$status.fulfillStatus', 'NOA']},
                                        then: {$literal: 'Partially fulfilled'}, else: {$literal: 'Not fulfilled'}
                                    }
                                }
                            }
                        }
                    }
                },

                shippingStatus: {
                    $addToSet: {
                        _id : '$status.shippingStatus',
                        name: {
                            $cond: {
                                if  : {$eq: ['$status.shippingStatus', 'ALL']}, then: {$literal: 'Shipped all'},
                                else: {
                                    $cond: {
                                        if  : {$eq: ['$status.shippingStatus', 'NOA']},
                                        then: {$literal: 'Partially shipped'}, else: {$literal: 'Not shipped'}
                                    }
                                }
                            }
                        }
                    }
                },

                channel: {
                    $addToSet: {
                        _id : '$channel._id',
                        name: '$channel.channelName'
                    }
                }
            }
        }, {
            $project: {
                salesPerson: {
                    $filter: {
                        input: '$salesPerson',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                allocationStatus: {
                    $filter: {
                        input: '$allocationStatus',
                        as   : 'element',
                        cond : {$and: [{$ne: ['$$element._id', null]}, {$ne: ['$$element._id', '']}, {$ne: ['$$element._id', 'NOR']}]}
                    }
                },

                fulfilledStatus: {
                    $filter: {
                        input: '$fulfilledStatus',
                        as   : 'element',
                        cond : {$and: [{$ne: ['$$element._id', null]}, {$ne: ['$$element._id', '']}, {$ne: ['$$element._id', 'NOR']}]}
                    }
                },

                shippingStatus: {
                    $filter: {
                        input: '$shippingStatus',
                        as   : 'element',
                        cond : {$and: [{$ne: ['$$element._id', null]}, {$ne: ['$$element._id', '']}, {$ne: ['$$element._id', 'NOR']}]}
                    }
                },

                supplier: {
                    $filter: {
                        input: '$supplier',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                workflow: {
                    $filter: {
                        input: '$workflow',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                channel: {
                    $filter: {
                        input: '$channel',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                name: {
                    $filter: {
                        input: '$name',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = Order.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};
            result.filterInfo = FILTER_CONSTANTS.order;

            res.status(200).send(result);
        });
    };

    this.getSalesOrdersFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var QuotationSchema = mongoose.Schemas.Quotation;
        var Quotation = models.get(lastDB, 'Quotation', QuotationSchema);
        var pipeLine;
        var aggregation;
        var query = {
            forSales: true,
            isOrder : true
        };
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                workflow     : {$arrayElemAt: ['$workflow', 0]},
                project      : {$arrayElemAt: ['$project', 0]},
                supplier     : {$arrayElemAt: ['$supplier', 0]},
                salesmanagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]}
                    }
                }
            }
        }, {
            $unwind: {
                path                      : '$salesmanagers',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesmanagers.employeeId',
                foreignField: '_id',
                as          : 'salesmanager'
            }
        }, {
            $project: {
                workflow    : 1,
                project     : 1,
                supplier    : 1,
                salesmanager: {$arrayElemAt: ['$salesmanager', 0]}
            }
        }, {
            $group: {
                _id: null,

                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: {$ifNull: ['$project.name', '']}
                    }
                },

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                },

                salesManager: {
                    $addToSet: {
                        _id : '$salesmanager._id',
                        name: {
                            $concat: ['$salesmanager.name.first', ' ', '$salesmanager.name.last']
                        }
                    }
                },
                workflow    : {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: {$ifNull: ['$workflow.name', '']}
                    }
                }
            }
        }, {
            $project: {
                salesManager: {
                    $filter: {
                        input: '$salesManager',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                supplier    : {
                    $filter: {
                        input: '$supplier',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                project     : {
                    $filter: {
                        input: '$project',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                workflow    : {
                    $filter: {
                        input: '$workflow',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = Quotation.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getOrdersFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var purchaseOrdersSchema = mongoose.Schemas.purchaseOrders;
        var Model = models.get(lastDB, 'purchaseOrders', purchaseOrdersSchema);
        var pipeLine;
        var aggregation;
        var query = {
            forSales: false,
            _type : 'purchaseOrders'
        };
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                workflow: {$arrayElemAt: ['$workflow', 0]},
                supplier: {$arrayElemAt: ['$supplier', 0]}
            }
        }, {
            $group: {
                _id: null,

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                }
            }
        }, {
            $project: {
                salesManager: {
                    $filter: {
                        input: '$salesManager',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                supplier    : {
                    $filter: {
                        input: '$supplier',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                project     : {
                    $filter: {
                        input: '$project',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                workflow    : {
                    $filter: {
                        input: '$workflow',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = Model.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getLeadsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var OpportunitiesSchema = mongoose.Schemas.Opportunitie;
        var Opportunities = models.get(lastDB, 'Opportunities', OpportunitiesSchema);
        var pipeLine;
        var aggregation;
        var query = {
            isOpportunitie: false
        };
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'customer',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $lookup: {

                from        : 'Employees',
                localField  : 'salesPerson',
                foreignField: '_id',
                as          : 'salesPerson'
            }
        }, {
            $lookup: {
                from        : 'Users',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user'
            }
        }, {
            $project: {
                workflow        : {$arrayElemAt: ['$workflow', 0]},
                source          : 1,
                name            : 1,
                contactName     : {$concat: ['$contactName.first', ' ', '$contactName.last']},
                customer        : {$arrayElemAt: ['$customer', 0]},
                salesPerson     : {$arrayElemAt: ['$salesPerson', 0]},
                'createdBy.user': {$arrayElemAt: ['$createdBy.user', 0]}
            }
        }, {
            $project: {
                workflow   : 1,
                source     : 1,
                name       : 1,
                contactName: 1,
                salesPerson: {
                    _id : '$salesPerson._id',
                    name: {$concat: ['$salesPerson.name.first', ' ', '$salesPerson.name.last']}
                },
                customer: {
                    _id : '$customer._id',
                    name: {$concat: ['$customer.name.first', ' ', '$customer.name.last']}
                },
                createdBy: {
                    _id : {$ifNull: ['$createdBy.user._id', 'None']},
                    name: {$ifNull: ['$createdBy.user.login', 'None']}
                }
            }
        }, {
            $group: {
                _id        : null,
                contactName: {
                    $addToSet: {
                        _id : '$contactName',
                        name: {
                            $cond: {
                                if: {
                                    $eq: ['$contactName', ' ']
                                },

                                then: 'None',
                                else: '$contactName'
                            }
                        }
                    }
                },

                source: {
                    $addToSet: {
                        _id : '$source',
                        name: '$source'
                    }
                },
                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: '$customer.name'
                    }
                },

                name: {
                    $addToSet: {
                        _id : '$name',
                        name: '$name'
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },

                salesPerson: {
                    $addToSet: {
                        _id : '$salesPerson._id',
                        name: '$salesPerson.name'
                    }
                },

                createdBy: {
                    $addToSet: {
                        _id : '$createdBy._id',
                        name: '$createdBy.name'
                    }
                }
            }
        }, {
            $project: {
                workflow   : {
                    $filter: {
                        input: '$workflow',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                source     : {
                    $filter: {
                        input: '$source',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                name: {
                    $filter: {
                        input: '$name',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                contactName: {
                    $filter: {
                        input: '$contactName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                salesPerson: {
                    $filter: {
                        input: '$salesPerson',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                customer   : {
                    $filter: {
                        input: '$customer',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                createdBy  : 1
            }
        }];

        aggregation = Opportunities.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getOpportunitiesFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var OpportunitiesSchema = mongoose.Schemas.Opportunitie;
        var Opportunities = models.get(lastDB, 'Opportunities', OpportunitiesSchema);
        var pipeLine;
        var aggregation;
        var query = {
            isOpportunitie: true
        };
        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'customer',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesPerson',
                foreignField: '_id',
                as          : 'salesPerson'
            }
        }, {
            $project: {
                customer   : {$arrayElemAt: ['$customer', 0]},
                workflow   : {$arrayElemAt: ['$workflow', 0]},
                salesPerson: {$arrayElemAt: ['$salesPerson', 0]},
                name       : 1
            }
        }, {
            $group: {
                _id: null,

                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: {$concat: ['$customer.name.first', ' ', '$customer.name.last']}
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },

                salesPerson: {
                    $addToSet: {
                        _id : '$salesPerson._id',
                        name: {$concat: ['$salesPerson.name.first', ' ', '$salesPerson.name.last']}
                    }
                },

                name: {
                    $addToSet: {
                        _id : '$name',
                        name: '$name'
                    }
                }
            }
        }, {
            $project: {
                customer   : {
                    $filter: {
                        input: '$customer',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                workflow   : {
                    $filter: {
                        input: '$workflow',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                salesPerson: {
                    $filter: {
                        input: '$salesPerson',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                name: {
                    $filter: {
                        input: '$name',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = Opportunities.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getSalaryReportFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var EmployeeSchema = mongoose.Schemas.Employee;
        var Employee = models.get(lastDB, 'Employee', EmployeeSchema);
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $lookup: {
                from        : 'Department',
                localField  : 'department',
                foreignField: '_id',
                as          : 'department'
            }
        }, {
            $project: {
                department: {$arrayElemAt: ['$department', 0]},
                name      : 1,
                isEmployee: 1
            }
        }, {
            $project: {
                department: 1,
                name      : 1,
                isEmployee: 1
            }
        }, {
            $group: {
                _id     : null,
                employee: {
                    $addToSet: {
                        _id       : '$_id',
                        name      : {$concat: ['$name.first', ' ', '$name.last']},
                        isEmployee: '$isEmployee'
                    }
                },

                department: {
                    $addToSet: {
                        _id : '$department._id',
                        name: {$ifNull: ['$department.name', 'None']}
                    }
                }
            }
        }];

        aggregation = Employee.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            result.onlyEmployees = [{
                    name: '是',
                    _id : 'true'
                },
                {
                    name: '否',
                    _id : 'false'
                }];

            res.status(200).send(result);
        });
    };

    this.getWtrackFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var wTrackSchema = mongoose.Schemas.wTrack;
        var WTrack = models.get(lastDB, 'wTrack', wTrackSchema);

        var pipeLine;
        var aggregation;

        pipeLine = [{
            $lookup: {
                from        : 'Project',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'employee',
                foreignField: '_id',
                as          : 'employee'
            }
        }, {
            $lookup: {
                from        : 'Department',
                localField  : 'department',
                foreignField: '_id',
                as          : 'department'
            }
        }, {
            $project: {
                project   : {$arrayElemAt: ['$project', 0]},
                employee  : {$arrayElemAt: ['$employee', 0]},
                department: {$arrayElemAt: ['$department', 0]},
                month     : 1,
                year      : 1,
                week      : 1,
                _type     : 1
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'project.customer',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $project: {
                customer  : {$arrayElemAt: ['$customer', 0]},
                project   : 1,
                employee  : 1,
                department: 1,
                month     : 1,
                year      : 1,
                week      : 1,
                _type     : 1
            }
        }, {
            $group: {
                _id : null,
                jobs: {
                    $addToSet: {
                        _id : '$jobs._id',
                        name: '$jobs.name'
                    }
                },

                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: '$project.name'
                    }
                },

                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: {
                            $concat: ['$customer.name.first', ' ', '$customer.name.last']
                        }
                    }
                },

                employee: {
                    $addToSet: {
                        _id: '$employee._id',

                        name: {
                            $concat: ['$employee.name.first', ' ', '$employee.name.last']
                        },

                        isEmployee: '$employee.isEmployee'
                    }
                },

                department: {
                    $addToSet: {
                        _id : '$department._id',
                        name: '$department.name'
                    }
                },

                year: {
                    $addToSet: {
                        _id : '$year',
                        name: '$year'
                    }
                },

                month: {
                    $addToSet: {
                        _id : '$month',
                        name: '$month'
                    }
                },

                week: {
                    $addToSet: {
                        _id : '$week',
                        name: '$week'
                    }
                },

                _type: {
                    $addToSet: {
                        _id : '$_type',
                        name: '$_type'
                    }
                }
            }
        }];

        aggregation = WTrack.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getExpensesInvoiceFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var ExpensesInvoiceSchema = mongoose.Schemas.expensesInvoice;
        var ExpensesInvoice = models.get(lastDB, 'expensesInvoice', ExpensesInvoiceSchema);
        var query = {
            forSales: false
        };
        var pipeLine;
        var aggregation;

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                workflow: {$arrayElemAt: ['$workflow', 0]},
                supplier: {$arrayElemAt: ['$supplier', 0]}
            }
        }, {
            $group: {
                _id     : null,
                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        }
                    }
                }
            }
        }];

        aggregation = ExpensesInvoice.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getWriteOffFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var WriteOffSchema = mongoose.Schemas.writeOff;
        var WriteOff = models.get(lastDB, 'writeOff', WriteOffSchema);

        var pipeLine;
        var aggregation;

        pipeLine = [{
            $match: {_type: 'writeOff'}
        }, {
            $lookup: {
                from        : 'journals',
                localField  : 'journal',
                foreignField: '_id',
                as          : 'journal'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $project: {
                project: {$arrayElemAt: ['$project', 0]},
                journal: {$arrayElemAt: ['$journal', 0]}
            }
        }, {
            $group: {
                _id    : null,
                journal: {
                    $addToSet: {
                        _id : '$journal._id',
                        name: '$journal.name'
                    }
                },

                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: '$project.name'
                    }
                }
            }
        }];

        aggregation = WriteOff.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getDividendInvoiceFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var DividendInvoiceSchema = mongoose.Schemas.dividendInvoice;
        var DividendInvoice = models.get(lastDB, 'dividendInvoice', DividendInvoiceSchema);
        var pipeLine;
        var aggregation;
        var query = {
            _type: 'dividendInvoice'
        };

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                workflow: {$arrayElemAt: ['$workflow', 0]}
            }
        }, {
            $group: {
                _id     : null,
                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                }
            }
        }];

        aggregation = DividendInvoice.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getDashVacationFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var EmployeeSchema = mongoose.Schemas.Employee;
        var ProjectMembersSchema = mongoose.Schemas.ProjectMember;
        var ProjectSchema = mongoose.Schemas.Project;
        var Employee = models.get(lastDB, 'Employee', EmployeeSchema);
        var ProjectMember = models.get(lastDB, 'ProjectMember', ProjectMembersSchema);
        var Project = models.get(lastDB, 'Project', ProjectSchema);
        var pipeLine;
        var aggregation;
        var reqQuery = req.query;
        var query;
        var startFilter;
        var startDate;
        var _startDate;
        var endDate;
        var _endDate;
        var dateRangeObject;
        var parallelTasks;

        function dateRange() {
            'use strict';
            var weeksArr = [];
            var startWeek = moment().isoWeek() - 1;
            var year = moment().isoWeekYear();
            var week;
            var i;

            for (i = 0; i <= 11; i++) {
                if (startWeek + i > 53) {
                    week = startWeek + i - 53;
                    weeksArr.push((year + 1) * 100 + week);
                } else {
                    week = startWeek + i;
                    weeksArr.push(year * 100 + week);
                }
            }

            weeksArr.sort();

            return {
                startDate: weeksArr[0],
                endDate  : weeksArr[weeksArr.length - 1]
            };
        }

        if (reqQuery) {
            startFilter = reqQuery.filter;

            if (startFilter) {
                startDate = startFilter.startDate;
                endDate = startFilter.startDate;
            } else if (reqQuery.startDate && reqQuery.endDate) {
                _startDate = moment(new Date(reqQuery.startDate));
                _endDate = moment(new Date(reqQuery.endDate));
                startDate = _startDate.isoWeekYear() * 100 + _startDate.isoWeek();
                endDate = _endDate.isoWeekYear() * 100 + _endDate.isoWeek();
            }
        }

        if (!startDate || !endDate) {
            dateRangeObject = dateRange();

            startDate = dateRangeObject.startDate;
            endDate = dateRangeObject.endDate;
        }

        query = {
            $or: [
                {
                    isEmployee: true
                }, {
                    $and: [{isEmployee: false}, {
                        lastFire: {
                            $ne : null,
                            $gte: startDate
                        }
                    }]
                }
            ]
        };

        function getSalesManagers(pCb) {
            ProjectMember.aggregate([{
                $match: {
                    projectPositionId: objectId(CONSTANTS.SALESMANAGER)
                }
            }, {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'employeeId',
                    foreignField: '_id',
                    as          : 'salesManagers'
                }
            }, {
                $project: {
                    salesManagers: {$arrayElemAt: ['$salesManagers', 0]}
                }
            }, {
                $project: {
                    'salesManagers._id' : 1,
                    'salesManagers.name': {
                        $concat: ['$salesManagers.name.first', ' ', '$salesManagers.name.last']
                    }
                }

            }, {
                $group: {
                    _id : '$salesManagers._id',
                    name: {
                        $first: '$salesManagers.name'
                    }

                }

            }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                if (!result.length) {
                    return pCb(null, result);
                }

                result.push({
                    _id : 'empty',
                    name: 'empty'
                });

                pCb(null, result);
            });

        }

        function getProjectTypes(pCb) {
            Project.aggregate([
                {
                    $group: {
                        _id : '$projecttype',
                        name: {
                            $first: '$projecttype'
                        }
                    }
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                if (!result.length) {
                    return pCb(null, result);
                }

                pCb(null, result);
            });
        }

        function getEmployees(pCb) {
            pipeLine = [{
                $match: query
            }, {
                $lookup: {
                    from        : 'Department',
                    localField  : 'department',
                    foreignField: '_id',
                    as          : 'department'
                }
            }, {
                $project: {
                    name      : 1,
                    department: {$arrayElemAt: ['$department', 0]}
                }
            }, {
                $group: {
                    _id : null,
                    name: {
                        $addToSet: {
                            _id : '$_id',
                            name: {$concat: ['$name.first', ' ', '$name.last']}
                        }
                    },

                    department: {
                        $addToSet: {
                            _id : '$department._id',
                            name: {
                                $ifNull: ['$department.name', 'None']
                            }
                        }
                    }
                }
            }];

            aggregation = Employee.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                if (!result.length) {
                    return pCb(null, result);
                }

                result = result[0];

                pCb(null, result);
            });
        }

        parallelTasks = [getEmployees, getSalesManagers, getProjectTypes];

        async.parallel(parallelTasks, function (err, result) {
            var sendFilterObject = result[0];

            sendFilterObject.salesManager = result[1];
            sendFilterObject.projecttype = result[2];

            res.status(200).send(sendFilterObject);
        });

    };

    this.getExpensesPaymentsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var ExpensesInvoicePaymentSchema = mongoose.Schemas.ExpensesInvoicePayment;
        var ExpensesPayments = models.get(lastDB, 'expensesInvoicePayment', ExpensesInvoicePaymentSchema);

        var pipeLine;
        var aggregation;

        var query = {
            _type: 'expensesInvoicePayment'
        };

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                supplier  : {$arrayElemAt: ['$supplier', 0]},
                paymentRef: 1,
                year      : 1,
                month     : 1,
                workflow  : 1
            }
        }, {
            $project: {
                supplier  : 1,
                paymentRef: 1,
                year      : 1,
                month     : 1,
                workflow  : 1
            }
        }, {
            $group: {
                _id: null,

                supplier: {
                    $addToSet: {
                        _id : '$supplier._id',
                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        },

                        isEmployee: '$supplier.isEmployee'
                    }
                },

                paymentRef: {
                    $addToSet: {
                        _id : '$paymentRef',
                        name: {
                            $ifNull: ['$paymentRef', 'None']
                        }
                    }
                },

                year: {
                    $addToSet: {
                        _id : '$year',
                        name: {
                            $ifNull: ['$year', 'None']
                        }
                    }
                },

                month: {
                    $addToSet: {
                        _id : '$month',
                        name: {
                            $ifNull: ['$month', 'None']
                        }
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow',
                        name: {
                            $ifNull: ['$workflow', 'None']
                        }
                    }
                }
            }
        }];

        aggregation = ExpensesPayments.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getDividendPaymentsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var ExpensesInvoicePaymentSchema = mongoose.Schemas.ExpensesInvoicePayment;
        var ExpensesPayments = models.get(lastDB, 'expensesInvoicePayment', ExpensesInvoicePaymentSchema);

        var pipeLine;
        var aggregation;

        var query = {
            _type: 'dividendInvoicePayment'
        };

        pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'supplier',
                foreignField: '_id',
                as          : 'supplier'
            }
        }, {
            $project: {
                supplier  : {$arrayElemAt: ['$supplier', 0]},
                paymentRef: 1,
                year      : 1,
                month     : 1,
                workflow  : 1
            }
        }, {
            $project: {
                supplier  : 1,
                paymentRef: 1,
                year      : 1,
                month     : 1,
                workflow  : 1
            }
        }, {
            $group: {
                _id: null,

                supplier: {
                    $addToSet: {
                        _id: '$supplier._id',

                        name: {
                            $concat: ['$supplier.name.first', ' ', '$supplier.name.last']
                        },

                        isEmployee: '$supplier.isEmployee'
                    }
                },

                paymentRef: {
                    $addToSet: {
                        _id : '$paymentRef',
                        name: {
                            $ifNull: ['$paymentRef', 'None']
                        }
                    }
                },

                year: {
                    $addToSet: {
                        _id : '$year',
                        name: {
                            $ifNull: ['$year', 'None']
                        }
                    }
                },

                month: {
                    $addToSet: {
                        _id : '$month',
                        name: {
                            $ifNull: ['$month', 'None']
                        }
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow',
                        name: {
                            $ifNull: ['$workflow', 'None']
                        }
                    }
                }
            }
        }];

        aggregation = ExpensesPayments.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });

    };

    this.getPayRollFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var PayRollSchema = mongoose.Schemas.PayRoll;
        var PayRoll = models.get(lastDB, 'PayRoll', PayRollSchema);

        var pipeLine;
        var aggregation;

        pipeLine = [{
            $group: {
                _id: null,

                year: {
                    $addToSet: {
                        _id : '$year',
                        name: '$year'
                    }
                },

                month: {
                    $addToSet: {
                        _id : '$month',
                        name: '$month'
                    }
                },

                employee: {
                    $addToSet: '$employee'
                },

                dataKey: {
                    $addToSet: {
                        _id : '$dataKey',
                        name: '$dataKey'
                    }
                },

                type: {
                    $addToSet: {
                        _id : '$type._id',
                        name: '$type.name'
                    }
                }
            }
        }];

        aggregation = PayRoll.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            if (result.dataKey) {
                result.dataKey = _.map(result.dataKey, function (element) {
                    element.name = element.name ? element.name.toString() : '';

                    return {
                        _id : element._id,
                        name: element.name.substring(4, 6) + '/' + element.name.substring(0, 4)
                    };
                });
            }

            res.status(200).send(result);
        });
    };

    this.getDashJobsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var JobsSchema = mongoose.Schemas.jobs;
        var Jobs = models.get(lastDB, 'jobs', JobsSchema);

        var pipeLine;
        var aggregation;

        pipeLine = [
            {
                $lookup: {
                    from        : 'projectMembers',
                    localField  : 'project',
                    foreignField: 'projectId',
                    as          : 'projectMembers'
                }
            }, {
                $lookup: {
                    from        : 'Project',
                    localField  : 'project',
                    foreignField: '_id',
                    as          : 'project'
                }
            }, {
                $lookup: {
                    from        : 'Invoice',
                    localField  : 'invoice',
                    foreignField: '_id',
                    as          : 'invoice'
                }
            }, {
                $lookup: {
                    from        : 'workflows',
                    localField  : 'workflow',
                    foreignField: '_id',
                    as          : 'workflow'
                }
            }, {
                $lookup: {
                    from        : 'Quotation',
                    localField  : 'quotation',
                    foreignField: '_id',
                    as          : 'quotation'
                }
            }, {
                $project: {
                    name         : 1,
                    workflow     : {$arrayElemAt: ['$workflow', 0]},
                    type         : 1,
                    wTracks      : 1,
                    project      : {$arrayElemAt: ['$project', 0]},
                    budget       : 1,
                    quotation    : {$arrayElemAt: ['$quotation', 0]},
                    invoice      : {$arrayElemAt: ['$invoice', 0]},
                    salesmanagers: {
                        $filter: {
                            input: '$projectMembers',
                            as   : 'projectMember',
                            cond : {$eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]}
                        }
                    }
                }
            }, {
                $unwind: {
                    path                      : '$salesmanagers',
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $lookup: {
                    from        : 'Payment',
                    localField  : 'invoice._id',
                    foreignField: 'invoice',
                    as          : 'payments'
                }
            }, {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'salesmanagers.employeeId',
                    foreignField: '_id',
                    as          : 'salesmanager'
                }
            }, {
                $project: {
                    order: {
                        $cond: {
                            if: {
                                $eq: ['$type', 'Not Quoted']
                            },

                            then: -1,
                            else: {
                                $cond: {
                                    if: {
                                        $eq: ['$type', 'Quoted']
                                    },

                                    then: 0,
                                    else: 1
                                }
                            }
                        }
                    },

                    name        : 1,
                    workflow    : 1,
                    type        : 1,
                    wTracks     : 1,
                    project     : 1,
                    budget      : 1,
                    quotation   : 1,
                    invoice     : 1,
                    salesmanager: {$arrayElemAt: ['$salesmanager', 0]},

                    payment: {
                        paid : {$sum: '$payments.paidAmount'},
                        count: {$size: '$payments'}
                    }
                }
            }, {
                $project: {
                    order       : 1,
                    name        : 1,
                    workflow    : 1,
                    type        : 1,
                    wTracks     : 1,
                    project     : 1,
                    budget      : 1,
                    quotation   : 1,
                    invoice     : 1,
                    salesmanager: 1,
                    payment     : 1
                }
            }, {
                $match: {
                    $or: [
                        {
                            'invoice._type': 'wTrackInvoice'
                        },
                        {quotation: {$exists: true}},
                        {type: 'Not Quoted'}
                    ]
                }
            }, {
                $group: {
                    _id: null,

                    type: {
                        $addToSet: {
                            _id : '$type',
                            name: '$type'
                        }
                    },

                    workflow: {
                        $addToSet: {
                            _id : '$workflow._id',
                            name: '$workflow.name'
                        }
                    },

                    project: {
                        $addToSet: {
                            _id : '$project._id',
                            name: '$project.name'
                        }
                    },

                    salesManager: {
                        $addToSet: {
                            _id : '$salesmanager._id',
                            name: {
                                $concat: ['$salesmanager.name.first', ' ', '$salesmanager.name.last']
                            }
                        }
                    },

                    paymentsCount: {
                        $addToSet: {
                            _id : '$payment.count',
                            name: '$payment.count'
                        }
                    }
                }
            }];

        aggregation = Jobs.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getJournalEntryFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var journalEntrySchema = mongoose.Schemas.journalEntry;
        var JournalEntry = models.get(lastDB, 'journalEntry', journalEntrySchema);
        var aggregation;
        var pipeLine = [{
            $lookup: {
                from        : 'journals',
                localField  : 'journal',
                foreignField: '_id',
                as          : 'journal'
            }
        }, {
            $project: {
                journal: {$arrayElemAt: ['$journal', 0]},
                name   : '$sourceDocument.name'
            }
        }, {
            $lookup: {
                from        : 'chartOfAccount',
                localField  : 'journal.debitAccount',
                foreignField: '_id',
                as          : 'debitAccount'
            }
        }, {
            $lookup: {
                from        : 'chartOfAccount',
                localField  : 'journal.creditAccount',
                foreignField: '_id',
                as          : 'creditAccount'
            }
        }, {
            $project: {
                journal      : 1,
                creditAccount: {$arrayElemAt: ['$creditAccount', 0]},
                debitAccount : {$arrayElemAt: ['$debitAccount', 0]},
                name         : 1
            }
        }, {
            $group: {
                _id: null,

                name: {
                    $addToSet: {
                        _id : '$name',
                        name: '$name'
                    }
                },

                journal: {
                    $addToSet: {
                        _id : '$journal._id',
                        name: '$journal.name'
                    }
                },

                creditAccount: {
                    $addToSet: {
                        _id : '$creditAccount._id',
                        name: '$creditAccount.name'
                    }
                },

                debitAccount: {
                    $addToSet: {
                        _id : '$debitAccount._id',
                        name: '$debitAccount.name'
                    }
                }
            }
        }];

        aggregation = JournalEntry.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };
    
    this.getInventoryReportFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var journalEntrySchema = mongoose.Schemas.journalEntry;
        var JournalEntry = models.get(lastDB, 'journalEntry', journalEntrySchema);

        var query = {
            'sourceDocument.model': 'product',
            debit                 : {$gt: 0}
        };

        var pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'Products',
                localField  : 'sourceDocument._id',
                foreignField: '_id',
                as          : 'product'
            }
        }, {
            $project: {
                product: {$arrayElemAt: ['$product', 0]}
            }
        }, {
            $lookup: {
                from        : 'jobs',
                localField  : 'product.job',
                foreignField: '_id',
                as          : 'job'
            }
        }, {
            $project: {
                job: {$arrayElemAt: ['$job', 0]}
            }
        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'job.project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'job.project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $project: {
                project      : {$arrayElemAt: ['$project', 0]},
                salesManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {
                            $and: [{
                                $eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]
                            }, {
                                $eq: ['$$projectMember.endDate', null]
                            }]
                        }
                    }
                }
            }
        }, {
            $project: {
                salesManager: {$arrayElemAt: ['$salesManagers', 0]},
                project     : 1,
                type        : '$project.projecttype'
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesManager.employeeId',
                foreignField: '_id',
                as          : 'salesManager'
            }
        }, {
            $project: {
                project     : 1,
                type        : 1,
                salesManager: {$arrayElemAt: ['$salesManager', 0]}
            }
        }, {
            $group: {
                _id    : null,
                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: '$project.name'
                    }
                },

                type: {
                    $addToSet: {
                        _id : '$type',
                        name: '$type'
                    }
                },

                salesManager: {
                    $addToSet: {
                        _id : '$salesManager._id',
                        name: {
                            $concat: ['$salesManager.name.first', ' ', '$salesManager.name.last']
                        }
                    }
                }
            }
        }];
        var aggregation;

        aggregation = JournalEntry.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getGoodsOutNotesFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var GoodsOutSchema = mongoose.Schemas.GoodsOutNote;
        var GoodsOutNote = models.get(lastDB, 'GoodsOutNote', GoodsOutSchema);
        var aggregation;

        var query = {
            _type: 'GoodsOutNote'
        };

        var pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'warehouse',
                localField  : 'warehouse',
                foreignField: '_id',
                as          : 'warehouse'
            }
        }, {
            $lookup: {
                from        : 'Order',
                localField  : 'order',
                foreignField: '_id',
                as          : 'order'
            }
        }, {
            $project: {
                warehouse: {$arrayElemAt: ['$warehouse', 0]},
                order    : {$arrayElemAt: ['$order', 0]},
                status   : 1,
                name     : 1
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'order.supplier',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $lookup: {
                from        : 'workflows',
                localField  : 'order.workflow',
                foreignField: '_id',
                as          : 'workflow'
            }
        }, {
            $project: {
                order           : 1,
                status          : 1,
                name            : 1,
                'warehouse.name': '$warehouse.name',
                'warehouse._id' : '$warehouse._id',
                workflow        : {$arrayElemAt: ['$workflow', 0]},
                customer        : {$arrayElemAt: ['$customer', 0]}
            }
        }, {
            $group: {
                _id : null,
                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$name'
                    }
                },

                warehouse: {
                    $addToSet: {
                        _id : '$warehouse._id',
                        name: '$warehouse.name'
                    }
                },

                workflow: {
                    $addToSet: {
                        _id : '$workflow._id',
                        name: '$workflow.name'
                    }
                },

                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: {
                            $concat: ['$customer.name.first', ' ', '$customer.name.last']
                        }
                    }
                }
            }
        }];

        aggregation = GoodsOutNote.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            result.status = [{
                name: 'Printed',
                _id : 'printed'
            }, {
                name: 'Picked',
                _id : 'picked'
            }, {
                name: 'Packed',
                _id : 'packed'
            }, {
                name: 'Shipped',
                _id : 'shipped'
            }];

            res.status(200).send(result);
        });
    };

    this.getStockTransactionsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var StockTransActionSchema = mongoose.Schemas.stockTransactions;
        var StockTransaction = models.get(lastDB, 'stockTransactions', StockTransActionSchema);
        var aggregation;

        var query = {
            _type: 'stockTransactions'
        };

        var pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'warehouse',
                localField  : 'warehouse',
                foreignField: '_id',
                as          : 'warehouse'
            }
        }, {
            $lookup: {
                from        : 'warehouse',
                localField  : 'warehouseTo',
                foreignField: '_id',
                as          : 'warehouseTo'
            }
        }, {
            $project: {
                warehouse  : {$arrayElemAt: ['$warehouse', 0]},
                warehouseTo: {$arrayElemAt: ['$warehouseTo', 0]},
                status     : 1
            }
        }, {
            $project: {
                order             : 1,
                status            : 1,
                'warehouse.name'  : '$warehouse.name',
                'warehouse._id'   : '$warehouse._id',
                'warehouseTo.name': '$warehouseTo.name',
                'warehouseTo._id' : '$warehouseTo._id'
            }
        }, {
            $group: {
                _id        : null,
                warehouse  : {
                    $addToSet: {
                        _id : '$warehouse._id',
                        name: '$warehouse.name'
                    }
                },
                warehouseTo: {
                    $addToSet: {
                        _id : '$warehouseTo._id',
                        name: '$warehouseTo.name'
                    }
                }
            }
        }];

        aggregation = StockTransaction.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            result.status = [{
                name: 'Printed',
                _id : 'printed'
            }, {
                name: 'Packed',
                _id : 'packed'
            }, {
                name: 'Shipped',
                _id : 'shipped'
            }, {
                name: 'Received',
                _id : 'received'
            }];

            res.status(200).send(result);
        });
    };

    this.getProductsAvailabilityFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var AvailabilitySchema = mongoose.Schemas.productsAvailability;
        var Availability = models.get(lastDB, 'productsAvailability', AvailabilitySchema);
        var aggregation;

        var pipeLine = [{
            $match: {isJob: false}
        }, {
            $lookup: {
                from        : 'warehouse',
                localField  : 'warehouse',
                foreignField: '_id',
                as          : 'warehouse'
            }
        }, {
            $lookup: {
                from        : 'locations',
                localField  : 'location',
                foreignField: '_id',
                as          : 'location'
            }
        }, {
            $lookup: {
                from        : 'Products',
                localField  : 'product',
                foreignField: '_id',
                as          : 'product'
            }
        }, {
            $lookup: {
                from        : 'GoodsNote',
                localField  : 'goodsInNote',
                foreignField: '_id',
                as          : 'goodsInNote'
            }
        }, {
            $project: {
                warehouse  : {$arrayElemAt: ['$warehouse', 0]},
                location   : {$arrayElemAt: ['$location', 0]},
                product    : {$arrayElemAt: ['$product', 0]},
                goodsInNote: {$arrayElemAt: ['$goodsInNote', 0]},
                status     : 1
            }
        }, {
            $lookup: {
                from        : 'Order',
                localField  : 'goodsInNote.order',
                foreignField: '_id',
                as          : 'order'
            }
        }, {
            $project: {
                order           : {$arrayElemAt: ['$order', 0]},
                product         : 1,
                'location.name' : '$location.name',
                'location._id'  : '$location._id',
                'warehouse.name': '$warehouse.name',
                'warehouse._id' : '$warehouse._id'
            }
        }, {
            $project: {
                'order.name': '$order.name',
                'order._id' : '$order._id',
                product     : 1,
                location    : 1,
                warehouse   : 1
            }
        }, {
            $group: {
                _id      : null,
                warehouse: {
                    $addToSet: {
                        _id : '$warehouse._id',
                        name: '$warehouse.name'
                    }
                },
                location : {
                    $addToSet: {
                        _id : '$location._id',
                        name: '$location.name'
                    }
                },
                product  : {
                    $addToSet: {
                        _id : '$product.name',
                        name: '$product.name'
                    }
                },
                order    : {
                    $addToSet: {
                        _id : '$order._id',
                        name: '$order.name'
                    }
                },

                SKU: {
                    $addToSet: {
                        _id : '$product._id',
                        name: '$product.info.SKU'
                    }
                }
            }
        }];

        aggregation = Availability.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getChartOfAccountFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var chartOfAccountSchema = mongoose.Schemas.chartOfAccount;
        var Model = models.get(lastDB, 'chartOfAccount', chartOfAccountSchema);
        var aggregation;

        var pipeLine = [{
            $lookup: {
                from        : 'accountsCategories',
                localField  : 'category',
                foreignField: '_id',
                as          : 'category'
            }
        }, {
            $lookup: {
                from        : 'PaymentMethod',
                localField  : '_id',
                foreignField: 'chartAccount',
                as          : 'payMethod'
            }
        }, {
            $project: {
                category : {$arrayElemAt: ['$category', 0]},
                code     : 1,
                account  : 1,
                payMethod: {$arrayElemAt: ['$payMethod', 0]}
            }
        }, {
            $group: {
                _id     : null,
                category: {
                    $addToSet: {
                        _id : '$category._id',
                        name: '$category.fullName'
                    }
                },

                account: {
                    $addToSet: {
                        _id : '$account',
                        name: '$account'
                    }
                },

                code: {
                    $addToSet: {
                        _id : '$code',
                        name: '$code'
                    }
                },

                currency: {
                    $addToSet: {
                        _id : {$ifNull: ['$payMethod.currency', 'None']},
                        name: {$ifNull: ['$payMethod.currency', 'None']}
                    }
                }
            }
        }];

        aggregation = Model.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });

    };
    
    this.getInventoryReportFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var journalEntrySchema = mongoose.Schemas.journalEntry;
        var JournalEntry = models.get(lastDB, 'journalEntry', journalEntrySchema);

        var query = {
            'sourceDocument.model': 'wTrack',
            debit                 : {$gt: 0}
        };

        var pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'jobs',
                localField  : 'sourceDocument._id',
                foreignField: '_id',
                as          : 'job'
            }
        }, {
            $project: {
                job: {$arrayElemAt: ['$job', 0]}
            }

        }, {
            $lookup: {
                from        : 'projectMembers',
                localField  : 'job.project',
                foreignField: 'projectId',
                as          : 'projectMembers'
            }
        }, {
            $lookup: {
                from        : 'Project',
                localField  : 'job.project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $project: {
                project      : {$arrayElemAt: ['$project', 0]},
                salesManagers: {
                    $filter: {
                        input: '$projectMembers',
                        as   : 'projectMember',
                        cond : {
                            $and: [{
                                $eq: ['$$projectMember.projectPositionId', objectId(CONSTANTS.SALESMANAGER)]
                            }, {
                                $eq: ['$$projectMember.endDate', null]
                            }]
                        }
                    }
                }
            }
        }, {
            $project: {
                salesManager: {$arrayElemAt: ['$salesManagers', 0]},
                project     : 1,
                type        : '$project.projecttype'
            }
        }, {
            $lookup: {
                from        : 'Employees',
                localField  : 'salesManager.employeeId',
                foreignField: '_id',
                as          : 'salesManager'
            }
        }, {
            $project: {
                project     : 1,
                type        : 1,
                salesManager: {$arrayElemAt: ['$salesManager', 0]}
            }
        }, {
            $group: {
                _id    : null,
                project: {
                    $addToSet: {
                        _id : '$project._id',
                        name: '$project.name'
                    }
                },

                type: {
                    $addToSet: {
                        _id : '$type',
                        name: '$type'
                    }
                },

                salesManager: {
                    $addToSet: {
                        _id : '$salesManager._id',
                        name: {
                            $concat: ['$salesManager.name.first', ' ', '$salesManager.name.last']
                        }
                    }
                }
            }
        }];
        var aggregation;

        aggregation = JournalEntry.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getWorkOrdersFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var workOrdersSchema = mongoose.Schemas.WorkOrder;
        var workOrders = models.get(lastDB, 'workOrders', workOrdersSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'Opportunities',
                localField  : 'projectName',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName      : {$arrayElemAt: ['$projectName', 0]},
                projectManager   : {$arrayElemAt: ['$projectName', 0]}
                
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: '$projectName.name'
                    }
                },

                projectManager: {
                    $addToSet: {
                        _id : '$projectManager._id',
                        name: '$projectManager.proManager'
                    }
                }
            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                projectManager: {
                    $filter: {
                        input: '$projectManager',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
            }
        }];

        aggregation = workOrders.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getOrderApprovalFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var workOrdersSchema = mongoose.Schemas.WorkOrder;
        var workOrders = models.get(lastDB, 'workOrders', workOrdersSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'Opportunities',
                localField  : 'projectName',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName      : {$arrayElemAt: ['$projectName', 0]},
                workNumber       : 1
                
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: '$projectName.name'
                    }
                },

                workNumber: {
                    $addToSet: {
                        _id : '$workNumber',
                        name: '$workNumber'
                    }
                }

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                workNumber: {
                    $filter: {
                        input: '$workNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = workOrders.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getPieceWagesFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var pieceWagesSchema = mongoose.Schemas.PieceWage;
        var pieceWages = models.get(lastDB, 'pieceWages', pieceWagesSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'Employees',
                localField  : 'employeeName',
                foreignField: '_id',
                as          : 'employeeName'
            }
        }, {
            $lookup: {
                from        : 'Department',
                localField  : 'empDepartment',
                foreignField: '_id',
                as          : 'empDepartment'
            }
        }, {
            $project: {
                employeeName      : {$arrayElemAt: ['$employeeName', 0]},
                empDepartment     : {$arrayElemAt: ['$empDepartment', 0]}
                
            }
        }, {
            $group: {
                _id: null,

                employeeName: {
                    $addToSet: {
                        _id : '$employeeName._id',
                        name: {$concat: ['$employeeName.name.first', ' ', '$employeeName.name.last']}
                    }
                },

                empDepartment: {
                    $addToSet: {
                        _id : '$empDepartment._id',
                        name: '$empDepartment.name'
                    }
                }

            }
        }, {
            $project: {                
                employeeName : {
                    $filter: {
                        input: '$employeeName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                empDepartment: {
                    $filter: {
                        input: '$empDepartment',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = pieceWages.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getOrderReckonsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var orderReckonsSchema = mongoose.Schemas.OrderReckonz;
        var orderReckons = models.get(lastDB, 'orderReckons', orderReckonsSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'Opportunities',
                localField  : 'projectName',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName      : {$arrayElemAt: ['$projectName', 0]},
                workNumber       : 1
                
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: '$projectName.name'
                    }
                },

                workNumber: {
                    $addToSet: {
                        _id : '$workNumber',
                        name: '$workNumber'
                    }
                }

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                workNumber: {
                    $filter: {
                        input: '$workNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = orderReckons.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getDesignRecFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var designRecSchema = mongoose.Schemas.DesignRec;
        var designRec = models.get(lastDB, 'designRec', designRecSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectName',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName      : {$arrayElemAt: ['$projectName', 0]},
                
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: '$projectName.name'
                    }
                }

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = designRec.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getAssignFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var designRecSchema = mongoose.Schemas.DesignRec;
        var designRec = models.get(lastDB, 'designRec', designRecSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectName',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName      : {$arrayElemAt: ['$projectName', 0]},
                
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: '$projectName.name'
                    }
                }

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = designRec.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getAluveneerOrdersFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
        var aluveneerOrders = models.get(lastDB, 'aluveneerOrders', aluveneerOrdersSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectName',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName      : {$arrayElemAt: ['$projectName', 0]},
                cgdh       : 1
                
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: '$projectName.name'
                    }
                },

                cgdh: {
                    $addToSet: {
                        _id : '$cgdh',
                        name: '$cgdh'
                    }
                }

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                workNumber: {
                    $filter: {
                        input: '$cgdh',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = aluveneerOrders.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getBuildingContractFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var buildingContractSchema = mongoose.Schemas.BuildingContract;
        var buildingContract = models.get(lastDB, 'buildingContract', buildingContractSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'Customers',
                localField  : 'customer',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $lookup: {
                from        : 'building',
                localField  : 'projectName',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName  : {$arrayElemAt: ['$projectName', 0]},
                customer     : {$arrayElemAt: ['$customer', 0]},
                contractNum  : 1
                
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: '$projectName.name'
                    }
                },

                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: {$concat: ['$customer.name.first', ' ', '$customer.name.last']}
                    }
                },

                contractNum: {
                    $addToSet: {
                        _id : '$contractNum',
                        name: '$contractNum'
                    }
                },

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                customer: {
                    $filter: {
                        input: '$customer',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                contractNum: {
                    $filter: {
                        input: '$contractNum',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = buildingContract.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getAluorderApprovalFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
        var aluveneerOrders = models.get(lastDB, 'aluveneerOrders', aluveneerOrdersSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectName',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName      : {$arrayElemAt: ['$projectName', 0]},
                cgdh             : 1
                
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: '$projectName.name'
                    }
                },

                cgdh: {
                    $addToSet: {
                        _id : '$cgdh',
                        name: '$cgdh'
                    }
                }

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                workNumber: {
                    $filter: {
                        input: '$cgdh',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = aluveneerOrders.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            result.priApproval = [
                {
                    name: '是',
                    _id : 'true'
                },
                {
                    name: '否',
                    _id : 'false'
                }
            ];

            res.status(200).send(result);
        });
    };

    this.getFileManagementFilters = function(req, res, next){
        var lastDB = req.session.lastDb;
        var CertificateSchema = mongoose.Schemas.Certificate;
        var certificate = models.get(lastDB, 'Certificate', CertificateSchema);
        var pipeLine = ([
            {
                $project:{
                    name : 1,
                    status : 1
                }
            },
            {
                $group: {
                    _id: null,
                    name: {
                        $addToSet: {
                            _id :'$name',
                            name:'$name' 
                        }
                    },
                    status: {
                        $addToSet: {
                            _id : '$status',
                            name: '$status'
                        }
                    }
                }
            }
        ]); 

        var aggregation;
        aggregation = certificate.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length ? result[0] : {};
            res.status(200).send(result);
        });
        
    };

    this.getCertificateHistoryFilters = function(req, res, next){
        var lastDB = req.session.lastDb;
        var fileManagementSchema = mongoose.Schemas.fileManagement;
        var fileManagement = models.get(lastDB, 'fileManagement', fileManagementSchema);

        var pipeLine = ([
            {
                $lookup: {
                    from: 'Certificate',
                    localField: 'certificate',
                    foreignField: '_id',
                    as : 'certificate'
                }
            },
            {
                $project: {
                    certificate: {$arrayElemAt: ['$certificate', 0]}
                }
            },
            {
                $project: {
                    'certificate.name': '$certificate.name',
                    'certificate._id': 1
                }
            },
            {
                $group: {
                    _id: null,
                    name: {
                        $addToSet: {
                            _id: '$certificate.name',
                            name: '$certificate.name'
                        }
                    }
                }
            }
        ]);

        var aggregation;
        aggregation = fileManagement.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length ? result[0] : {};  
            res.status(200).send(result);
        });
    };

    this.getProductBunchTypeFilters = function(req, res, next){
        var lastDb = req.session.lastDb;
        var productBunchTypeSchema = mongoose.Schemas.productBunchType;
        var productBunchType = models.get(lastDb, 'productBunchType', productBunchTypeSchema);

        var pipeLine = ([
            {
                $match: {
                    status: 'new'
                }
            },
            {
                $project: {
                    name: 1,
                }
            },
            {
                $group: {
                    _id: null,
                    name: {
                        $addToSet: {
                            _id: '$name',
                            name: '$name'
                        }
                    }
                }
            }

        ]);

        var aggregation;
        aggregation = productBunchType.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length ? result[0] : {};  
            res.status(200).send(result);
        });
    };

    this.getProductSurfaceTreatFilters = function(req, res, next){
        var lastDb = req.session.lastDb;
        var productSurfaceTreatSchema = mongoose.Schemas.productSurfaceTreat;
        var productSurfaceTreat = models.get(lastDb, 'productSurfaceTreat', productSurfaceTreatSchema);

        var pipeLine = ([
            {
                $match: {
                    status: 'new'
                }
            },
            {
                $project: {
                    name: 1,
                }
            },
            {
                $group: {
                    _id: null,
                    name: {
                        $addToSet: {
                            _id: '$name',
                            name: '$name'
                        }
                    }
                }
            }

        ]);

        var aggregation;
        aggregation = productSurfaceTreat.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length ? result[0] : {};  
            res.status(200).send(result);
        });
    };

    this.getEngineerInfoFilters = function (req, res, next){
        var lastDb = req.session.lastDb;
        var engineerInfoSchema = mongoose.Schemas.engineerInfo;
        var engineerInfo = models.get(lastDb, 'engineerInfo', engineerInfoSchema);

        var pipeLine = ([
            {
                $match: {
                    status: 'new'
                }
            },
            {
                $project: {
                    name: 1
                }
            },
            {
                $group: {
                    _id: null,
                    name: {
                        $addToSet: {
                            _id: '$name',
                            name: '$name'
                        }
                    }
                }
            }
        ]);

        var aggregation;
        aggregation = engineerInfo.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length? result[0] : {};
            res.status(200).send(result);
        });
    };

    this.getManagementRuleFilters = function(req, res, next){
        var lastDb = req.session.lastDb;
        var managementRuleSchema = mongoose.Schemas.managementRule;
        var managementRule = models.get(lastDb, 'managementRule', managementRuleSchema);

        var pipeLine = ([
            {
                $match: {
                    status: 'new'
                }
            },
            {
                $project: {
                    categoryTex: 1
                }
            },
            {
                $group: {
                    _id: null,
                    categoryTex: {
                        $addToSet: {
                            _id: '$categoryTex',
                            name: '$categoryTex'
                        }
                    }
                }
            }
        ]);

        var aggregation;
        aggregation = managementRule.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length? result[0] : {};
            res.status(200).send(result);
        });
    };

    this.getSafetyManagementFilters = function(req, res, next){
        var lastDb = req.session.lastDb;
        var safetyManagementSchema = mongoose.Schemas.safetyManagement;
        var safetyManagement = models.get(lastDb, 'safetyManagement', safetyManagementSchema);

        var pipeLine = ([
            {
                $match: {
                    status:{
                        $ne: 'deleted',
                        $ne: 'edited'
                    }
                }
            },
            {
                $lookup: {
                    from: 'safetyManClassify',
                    localField: 'classify',
                    foreignField: '_id',
                    as: 'classify'
                }
            },
            {
                $project: {
                    classify: {$arrayElemAt: ['$classify', 0]}
                }
            },
            {
                $group: {
                    _id: null,
                    classify: {
                        $addToSet: {
                            _id: '$classify._id',
                            name: '$classify.name'
                        }
                    }
                }
            }
        ]);

        var aggregation;
        aggregation = safetyManagement.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length? result[0] : {};
            res.status(200).send(result);
        });
    };

    this.getProductParameterFilters = function(req, res, next){
        var lastDb = req.session.lastDb;
        var productSchema = mongoose.Schemas.Products;
        var productModel = models.get(lastDb, 'Products', productSchema);

        var pipeLine = ([   
            {
                $project: {
                    name: 1
                }
            },
            {
                $group: {
                    _id: null,
                    name: {
                        $addToSet: {
                            _id: '$name',
                            name: '$name'
                        }
                    }
                }
            }
        ]);

        var aggregation;
        aggregation = productModel.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length? result[0] : {};
            res.status(200).send(result);
        });
    };

    this.getSocialInsuranceFilters = function (req, res, next) {
        var lastDb = req.session.lastDb;
        var socialInsuranceSchema = mongoose.Schemas.socialInsurance;
        var socialInsurance = models.get(lastDb, 'socialInsurance', socialInsuranceSchema);
	var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        var pipeLine = ([
            {
                $lookup: {
                    from:　'Employees',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employee'
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
                    employee: {$arrayElemAt: ['$employee', 0]},
                    department: {$arrayElemAt: ['$department', 0]}
                }
            },
            {
                $group: {
                    _id: null,
                    employee: {
                        $addToSet: {
                            _id: '$employee._id',
                            name: {$concat: ['$employee.name.first', ' ' , '$employee.name.last']}
                        }
                    },
                    department: {
                        $addToSet: {
                            _id: '$department._id',
                            name: '$department.name'
                        }
                    }
                }
            },
	    {
                $project: {     
                    employee: {
                        $filter: {
                            input: '$employee',
                            as   : 'element',
                            cond : notNullQuery
                        }
                    },

                    department: {
                        $filter: {
                            input: '$department',
                            as: 'element',
                            cond: notNullQuery
                        }
                    }
                    
                }
            }
        ]);
        var aggregation;
        aggregation = socialInsurance.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function(err, result){
            if(err){
                return next(err);
            }
            var result = result.length? result[0] : {};
            res.status(200).send(result);
        });

    };

    this.getRoyaltyDetailsFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var royaltyDetailsSchema = mongoose.Schemas.royaltyDetails;
        var royaltyDetails = models.get(lastDB, 'royaltyDetails', royaltyDetailsSchema);
        var aggregation;

        var pipeLine = [
        {
            $lookup: {
                from        : 'Opportunities',
                localField  : 'project',
                foreignField: '_id',
                as          : 'project'
            }
        }, {
            $project: {
                project    : {$arrayElemAt: ['$project', 0]},
                comRate    : 1,
                diffCoef   : 1,
                persons    : 1
            }
        }, {
            $project: {
               'project._id'       : '$project._id',
               'project.name'      : '$project.name',
               'project.bidCost'   : '$project.bidCost',
               'project.biderDate' : '$project.biderDate',
                year       : {$year: '$project.biderDate'}, 
                comRate    : 1,
                diffCoef   : 1,
                persons    : 1
            }
        },{
            $group: {
                _id : null,
                year: {
                    $addToSet: {
                        _id : '$year',
                        name: '$year'
                    }
                }
            }
        }];

        aggregation = royaltyDetails.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getDepRoyaltyFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var depRoyaltySchema = mongoose.Schemas.DepRoyalty;
        var DepRoyalty = models.get(lastDB, 'DepRoyalty', depRoyaltySchema);
        var aggregation;

        var pipeLine = [{
                $lookup: {
                    from        : 'Employees',
                    localField  : 'person',
                    foreignField: '_id',
                    as          : 'person'
                }
            },{
                $project:{
                    person      : {$arrayElemAt: ['$person', 0]},
                    year        : 1,
                    guaSalary   : 1,
                    basePay     : 1,
                    ratedAtten  : 1,
                    effecAtten  : 1,
                    paidWages   : 1,
                    commission  : 1,
                    wBonuses    : 1,
                    description : 1
                }
            }, {
                $project: {
                    person : {
                        _id : '$person._id',
                        name: {$concat: ['$person.name.first', ' ', '$person.name.last']}
                    },
                    year          : 1,
                    guaSalary     : 1,
                    basePay       : 1,
                    ratedAtten    : 1,
                    effecAtten    : 1,
                    paidWages     : 1,
                    commission    : 1,
                    wBonuses      : 1,
                    description   : 1   
                }        
            }, {
                $group: {
                    _id : null,
                    year: {
                        $addToSet: {
                            _id : '$year',
                            name: '$year'
                        }
                    }
                }
            }];

        aggregation = DepRoyalty.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getAcceptFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var acceptSchema = mongoose.Schemas.Accept;
        var accept = models.get(lastDB, 'accept', acceptSchema);
        var aggregation;

        var pipeLine = [{
            $project:{
                acceptType : 1
            }
        }, {
            $group: {
                _id : null,
                acceptType: {
                    $addToSet: {
                        _id : '$acceptType',
                        name: '$acceptType'
                    }
                }
            }
        }];

        aggregation = accept.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            result.acceptType=[
                {
                    name:'买入',
                    _id:'buy'
                },
                {
                    name:'公司自开',
                    _id:'company'
                },
                {
                    name:'项目部交入',
                    _id:'project'
                }
            ];
            res.status(200).send(result);
        });
    };

    this.getBuildingFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var buildingSchema = mongoose.Schemas.Building;
        var building = models.get(lastDB, 'building', buildingSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'Customers',
                localField  : 'customerId',
                foreignField: '_id',
                as          : 'customerId'
            }
        }, {
            $project: {
                name             : 1,
                customerId       : {$arrayElemAt: ['$customerId', 0]},
                projectManager   : 1
                
            }
        }, {
            $group: {
                _id: null,

                name: {
                    $addToSet: {
                        _id : '$name',
                        name: '$name'
                    }
                },

                customerId: {
                    $addToSet: {
                        _id : '$customerId._id',
                        name: {$concat: ['$customerId.name.first', ' ', '$customerId.name.last']}
                    }
                },

                projectManager: {
                    $addToSet: {
                        _id : '$projectManager',
                        name: '$projectManager'
                    }
                }

            }
        }, {
            $project: {                
                name   : {
                    $filter: {
                        input: '$name',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                customerId   : {
                    $filter: {
                        input: '$customerId',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                projectManager: {
                    $filter: {
                        input: '$projectManager',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = building.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getProduceScheduleFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var produceScheduleSchema = mongoose.Schemas.ProduceSchedule;
        var produceSchedule = models.get(lastDB, 'produceSchedule', produceScheduleSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectId',
                foreignField: '_id',
                as          : 'projectId'
            }
        }, {
            $project: {

                projectId       : {$arrayElemAt: ['$projectId', 0]},
                orderNumber     : 1,
                produceType     : 1,
                scheduleDate    : 1
                
            }
        }, {
            $group: {
                _id: null,

                projectId: {
                    $addToSet: {
                        _id : '$projectId._id',
                        name: {$concat: ['$projectId.name']}
                    }
                },

                orderNumber: {
                    $addToSet: {
                        _id : '$orderNumber',
                        name: '$orderNumber'
                    }
                },

                produceType: {
                    $addToSet: {
                        _id : '$produceType',
                        name: '$produceType'
                    }
                },

                scheduleDate: {
                    $addToSet: {
                        _id : '$scheduleDate',
                        name: '$scheduleDate'
                    }
                }

            }
        }, {
            $project: {                
                projectId   : {
                    $filter: {
                        input: '$projectId',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                orderNumber   : {
                    $filter: {
                        input: '$orderNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                produceType: {
                    $filter: {
                        input: '$produceType',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                scheduleDate: {
                    $filter: {
                        input: '$scheduleDate',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = produceSchedule.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getGoodsInNotesFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var GoodsInSchema = mongoose.Schemas.GoodsInNote;
        var GoodsInNote = models.get(lastDB, 'GoodsInNote', GoodsInSchema);
        var aggregation;

        var query = {
            _type: 'GoodsInNote'
        };

        var pipeLine = [{
            $match: query
        }, {
            $lookup: {
                from        : 'warehouse',
                localField  : 'warehouse',
                foreignField: '_id',
                as          : 'warehouse'
            }
        }, {
            $lookup: {
                from        : 'Order',
                localField  : 'order',
                foreignField: '_id',
                as          : 'order'
            }
        }, {
            $project: {
                warehouse    : {$arrayElemAt: ['$warehouse', 0]},
                order        : {$arrayElemAt: ['$order', 0]},
                name         : 1,
                // status       : 1,
                // isValid      : 1,
                shippinglist : 1
            }
        }, {
            $lookup: {
                from        : 'Customers',
                localField  : 'order.supplier',
                foreignField: '_id',
                as          : 'customer'
            }
        }, {
            $project: {
                name            : 1,
                'warehouse.name': '$warehouse.name',
                'warehouse._id' : '$warehouse._id',
                'order.name'    : '$order.name',
                'order._id'     : '$order._id',
                customer        : {$arrayElemAt: ['$customer', 0]},
                shippinglist    : 1
            }
        }, {
            $group: {
                _id : null,
                name: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$name'
                    }
                },

                warehouse: {
                    $addToSet: {
                        _id : '$warehouse._id',
                        name: '$warehouse.name'
                    }
                },

                order: {
                    $addToSet : {
                        _id : '$order._id',
                        name: '$order.name'
                    }
                },

                shippinglist: {
                    $addToSet : {
                        _id : '$shippinglist',
                        name: '$shippinglist'
                    }
                },
                customer: {
                    $addToSet: {
                        _id : '$customer._id',
                        name: {
                            $concat: ['$customer.name.first', ' ', '$customer.name.last']
                        }
                    }
                }
           }
        }];

        aggregation = GoodsInNote.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            result.isValid = [
                {
                    name: '是',
                    _id : 'true'
                },
                {
                    name: '否',
                    _id : 'false'
                }
            ];

            result.status = [
                {
                    name: '是',
                    _id : 'true'
                },
                {
                    name: '否',
                    _id : 'false'
                }
            ];

            res.status(200).send(result);
        });
    };

    this.getGoodsReturnFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var writeOffsSchema = mongoose.Schemas.WriteOffs;
        var writeOffs = models.get(lastDB, 'writeOffs', writeOffsSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectId',
                foreignField: '_id',
                as          : 'projectId'
            }
        }, {
            $project: {

                projectId       : {$arrayElemAt: ['$projectId', 0]},
                orderNumber     : 1,
                state           : 1,
                type            : 1
            }
        }, {
            $match: {
                $or: [{type : 'goodsReturn'},{type : 'oemReturn'}]
            }
        }, {
            $group: {
                _id: null,

                projectId: {
                    $addToSet: {
                        _id : '$projectId._id',
                        name: {$concat: ['$projectId.name']}
                    }
                },

                orderNumber: {
                    $addToSet: {
                        _id : '$orderNumber',
                        name: '$orderNumber'
                    }
                },

                state: {
                    $addToSet: {
                        _id : '$state',
                        name: '$state'
                    }
                }

            }
        }, {
            $project: {                
                projectId   : {
                    $filter: {
                        input: '$projectId',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                orderNumber   : {
                    $filter: {
                        input: '$orderNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                state: {
                    $filter: {
                        input: '$state',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = writeOffs.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            result.type = [
                {
                    name: '建材退货',
                    _id : 'goodsReturn'
                },
                {
                    name: '来料退货',
                    _id : 'oemReturn'
                }
            ];

            res.status(200).send(result);
        });
    };

    this.getGoodsBarcodeFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var writeOffsSchema = mongoose.Schemas.WriteOffs;
        var writeOffs = models.get(lastDB, 'writeOffs', writeOffsSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectId',
                foreignField: '_id',
                as          : 'projectId'
            }
        }, {
            $lookup: {
                from        : 'GoodsNote',
                localField  : 'deliverNumber',
                foreignField: '_id',
                as          : 'deliverNumber'
            }
        }, {
            $project: {

                projectId       : {$arrayElemAt: ['$projectId', 0]},
                orderNumber     : 1,
                type            : 1,
                deliverNumber   : {$arrayElemAt: ['$deliverNumber', 0]}
                
            }
        }, {
            $match: {
                type : 'goodsReturn'
            }
        }, {
            $group: {
                _id: null,

                projectId: {
                    $addToSet: {
                        _id : '$projectId._id',
                        name: {$concat: ['$projectId.name']}
                    }
                },

                orderNumber: {
                    $addToSet: {
                        _id : '$orderNumber',
                        name: '$orderNumber'
                    }
                },

                deliverNumber: {
                    $addToSet: {
                        _id : '$deliverNumber._id',
                        name: {$concat: ['$deliverNumber.name']}
                    }
                }

            }
        }, {
            $project: {                
                projectId   : {
                    $filter: {
                        input: '$projectId',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                orderNumber   : {
                    $filter: {
                        input: '$orderNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                deliverNumber: {
                    $filter: {
                        input: '$deliverNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = writeOffs.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getGoodsScrapFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var writeOffsSchema = mongoose.Schemas.WriteOffs;
        var writeOffs = models.get(lastDB, 'writeOffs', writeOffsSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectId',
                foreignField: '_id',
                as          : 'projectId'
            }
        }, {
            $lookup: {
                from        : 'GoodsNote',
                localField  : 'deliverNumber',
                foreignField: '_id',
                as          : 'deliverNumber'
            }
        }, {
            $project: {

                projectId       : {$arrayElemAt: ['$projectId', 0]},
                orderNumber     : 1,
                type            : 1,
                deliverNumber   : {$arrayElemAt: ['$deliverNumber', 0]}
                
            }
        }, {
            $match: {
                type : 'goodsScrap'
            }
        }, {
            $group: {
                _id: null,

                projectId: {
                    $addToSet: {
                        _id : '$projectId._id',
                        name: {$concat: ['$projectId.name']}
                    }
                },

                orderNumber: {
                    $addToSet: {
                        _id : '$orderNumber',
                        name: '$orderNumber'
                    }
                },

                deliverNumber: {
                    $addToSet: {
                        _id : '$deliverNumber._id',
                        name: {$concat: ['$deliverNumber.name']}
                    }
                }

            }
        }, {
            $project: {                
                projectId   : {
                    $filter: {
                        input: '$projectId',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                orderNumber   : {
                    $filter: {
                        input: '$orderNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                deliverNumber: {
                    $filter: {
                        input: '$deliverNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = writeOffs.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getOemBarcodeFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var writeOffsSchema = mongoose.Schemas.WriteOffs;
        var writeOffs = models.get(lastDB, 'writeOffs', writeOffsSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectId',
                foreignField: '_id',
                as          : 'projectId'
            }
        }, {
            $lookup: {
                from        : 'GoodsNote',
                localField  : 'deliverNumber',
                foreignField: '_id',
                as          : 'deliverNumber'
            }
        }, {
            $project: {

                projectId       : {$arrayElemAt: ['$projectId', 0]},
                orderNumber     : 1,
                type            : 1,
                deliverNumber   : {$arrayElemAt: ['$deliverNumber', 0]}
                
            }
        }, {
            $match: {
                type : 'oemReturn'
            }
        }, {
            $group: {
                _id: null,

                projectId: {
                    $addToSet: {
                        _id : '$projectId._id',
                        name: {$concat: ['$projectId.name']}
                    }
                },

                orderNumber: {
                    $addToSet: {
                        _id : '$orderNumber',
                        name: '$orderNumber'
                    }
                },

                deliverNumber: {
                    $addToSet: {
                        _id : '$deliverNumber._id',
                        name: {$concat: ['$deliverNumber.name']}
                    }
                }

            }
        }, {
            $project: {                
                projectId   : {
                    $filter: {
                        input: '$projectId',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                orderNumber   : {
                    $filter: {
                        input: '$orderNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                deliverNumber: {
                    $filter: {
                        input: '$deliverNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = writeOffs.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getOemNotesFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var oemNoteSchema = mongoose.Schemas.oemNote;
        var oemNote = models.get(req.session.lastDb, 'oemNote', oemNoteSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'Order',
                localField  : 'order',
                foreignField: '_id',
                as          : 'order'
            }
        }, {
            $lookup: {
                from        : 'warehouse',
                localField  : 'warehouse',
                foreignField: '_id',
                as          : 'warehouse'
            }
        }, {
            $project: {

                name     : 1,
                order     : {$arrayElemAt: ['$order', 0]},
                warehouse: {$arrayElemAt: ['$warehouse', 0]},
                status   : 1,
                createdBy: 1,
                date     : 1,
                _type    : 1,
                reason   : 1,
                shippinglist : 1,
                description : 1
                
            }
        }, {
            $match: {
                _type : 'oemNote'
            }
        }, {
            $lookup: {
                from        : 'building',
                localField  : 'order.building',
                foreignField: '_id',
                as          : 'building'
            }
        }, {
            $project: {
                name            : 1,
                status          : 1,
                'warehouse._id' : '$warehouse._id',
                'warehouse.name': '$warehouse.name',
                building        : {$arrayElemAt: ['$building', 0]},
                _type           : 1,
                date            : 1,
                createdBy       : 1,
                reason          : 1,
                shippinglist    : 1,
                description     : 1
            }
        }, {
            $project: {
                name           : 1,
                status         : 1,
                warehouse      : 1,
                date           : 1,
                _type          : 1,
                createdBy      : 1,
                reason         : 1,
                shippinglist   : 1,
                description    : 1,
                'building._id' : '$building._id',
                'building.name': '$building.name',
            }
        }, {
            $group: {
                _id: null,

                building: {
                    $addToSet: {
                        _id : '$building._id',
                        name: {$concat: ['$building.name']}
                    }
                },

                name: {
                    $addToSet: {
                        _id : '$name',
                        name: '$name'
                    }
                },

                reason: {
                    $addToSet: {
                        _id : '$reason',
                        name: '$reason'
                    }
                },

            }
        }, {
            $project: {                
                building   : {
                    $filter: {
                        input: '$building',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                name   : {
                    $filter: {
                        input: '$name',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                reason: {
                    $filter: {
                        input: '$reason',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = oemNote.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            result.reason = [
                {
                    name : '原料入库',
                    _id  : 'RI'
                },
                {
                    name : '原料出库',
                    _id  : 'RO'
                },
                {
                    name : '成品入库',
                    _id  : 'FI'
                },
                {
                    name : '成品出库计划',
                    _id  : 'FO'
                }
            ];

            res.status(200).send(result);
        });
    };

    this.getTimeCardFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var timeCardSchema = mongoose.Schemas.timeCard;
        var timeCard = models.get(lastDB, 'timeCard', timeCardSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
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
               department: {$arrayElemAt: ['$department', 0]}
            }
        }, 
        {
            $group: {
                _id: null,

                name : {
                    $addToSet: {
                        _id : '$empid',
                        name: {$concat: ['$name']}
                    }
                },

                department: {
                    $addToSet: {
                        _id: '$department._id',
                        name: {$concat: ['$department.name']}
                    }
                }
            }
        }, {
            $project: {                
                name   : {
                    $filter: {
                        input: '$name',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                department: {
                    $filter: {
                        input: '$department',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
            }
        }];

        aggregation = timeCard.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getColorNumberFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var colorNumberSchema = mongoose.Schemas.ColorNumber;
        var colorNumber = models.get(req.session.lastDb, 'colorNumber', colorNumberSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'projectId',
                foreignField: '_id',
                as          : 'projectId'
            }
        }, {
            $project: {
                projectId   : {$arrayElemAt: ['$projectId', 0]},
                colorNumber : 1,            
            }
        }, {
            $group: {
                _id: null,

                projectId: {
                    $addToSet: {
                        _id : '$projectId._id',
                        name: {$concat: ['$projectId.name']}
                    }
                },

                colorNumber: {
                    $addToSet: {
                        _id : '$colorNumber',
                        name: '$colorNumber'
                    }
                }

            }
        }, {
            $project: {                
                projectId   : {
                    $filter: {
                        input: '$projectId',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                colorNumber   : {
                    $filter: {
                        input: '$colorNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = colorNumber.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getShippingNoteFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var shippingNoteSchema = mongoose.Schemas.shippingNote;
        var shippingNote = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
	    $match: {
		_type: 'shippingNote'
	    }
        },
	{
            $lookup: {
                from        : 'GoodsNote',
                localField  : 'goodsOutNote',
                foreignField: '_id',
                as          : 'goodsOutNote'
            }
        }, 
        {
            $project: {
                goodsOutNote   : {$arrayElemAt: ['$goodsOutNote', 0]},
                trips: 1       
            }
        },
        {
            $project: {
                'goodsOutNote.order': '$goodsOutNote.order',
                trips: 1
            }
        },
        {
            $lookup: {
                from: 'Order',
                localField: 'goodsOutNote.order',
                foreignField: '_id',
                as: 'goodsOutNote.order'
            }
        },
        {
            $project: {
                'goodsOutNote.order': {$arrayElemAt: ['$goodsOutNote.order', 0]},
                trips: 1
            }
        },
        {
            $lookup: {
                from: 'building',
                localField: 'goodsOutNote.order.building',
                foreignField: '_id',
                as: 'goodsOutNote.order.building'
            }
        },
        {
            $project: {
                building: {$arrayElemAt: ['$goodsOutNote.order.building', 0]},
                trips: 1
            }
        },
        {
            $project: {
                projectName: '$building.name',
                trips: 1
            }
        },
        {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName',
                        name: '$projectName'
                    }
                },

                trips: {
                    $addToSet: {
                        _id: '$_id',
                        name: '$trips'
                    }
                }

            }
        }, {
            $project: {     

                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                trips: {
                    $filter: {
                        input: '$trips',
                        as: 'element',
                        cond: notNullQuery
                    }
                }
                
            }
        }];

        aggregation = shippingNote.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getShippingPlanFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var GoodsOutNoteSchema = mongoose.Schemas.GoodsOutNote;
        var goodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', GoodsOutNoteSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from: 'Order',
                localField: 'order',
                foreignField: '_id',
                as: 'order'
            }
        },
        {
            $project: {
                'order': {$arrayElemAt: ['$order', 0]}
            }
        },
        {
            $lookup: {
                from: 'building',
                localField: 'order.building',
                foreignField: '_id',
                as: 'order.building'
            }
        },
        {
            $project: {
                building: {$arrayElemAt: ['$order.building', 0]}
            }
        },
        {
            $project: {
                projectName: '$building.name' 
            }
        },
        {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName',
                        name: '$projectName'
                    }
                },

            }
        }, {
            $project: {     

                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },
                
            }
        }];

        aggregation = goodsOutNote.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getShippingFeeFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var shippingNoteSchema = mongoose.Schemas.ShippingNote;
        var shippingNote = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
            {
                $match: {
 	            status: 'Done'
                }
            },
            {
                $lookup: {
                    from: 'GoodsNote',
                    localField: 'goodsOutNote',
                    foreignField: '_id',
                    as: 'goodsOutNote'
                }
            },
	    {
 		$lookup: {
		    from: 'GoodsNote',
                    localField: 'oemNote',
                    foreignField: '_id',
                    as: 'oemNote'
                }
            },
            {
                $project: {
                    goodsOutNote: {$arrayElemAt: ['$goodsOutNote', 0]},
		    oemNote: {$arrayElemAt: ['$oemNote', 0]},
                    ID: 1,                   
                    deliverMan:1
                }
            },
	    {
		$project: {
		    goodsOutNote: {$ifNull: ['$goodsOutNote', '$oemNote']},
                    ID: 1,
                    deliverMan: 1
                }
	    },
            {
                $project: {                
                    'goodsOutNote.order': '$goodsOutNote.order',
                    ID: 1,                    
                    deliverMan:1                
                }
            },
            {
                $lookup: {
                    from: 'Order',
                    localField: 'goodsOutNote.order',
                    foreignField: '_id',
                    as: 'goodsOutNote.order'
                }
            },
            {
                $project: {
                    'goodsOutNote.order': {$arrayElemAt: ['$goodsOutNote.order', 0]},
                    ID: 1,                          
                    deliverMan:1                                  
                }
            },
            {
                $lookup: {
                    from: 'building',
                    localField: 'goodsOutNote.order.building',
                    foreignField: '_id',
                    as: 'projectName'
                }
            },
            {
                $project: {                    
                    projectName: {$arrayElemAt: ['$projectName', 0]},
                    ID: 1,           
                    deliverMan:1
                }
            },{
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName.name',
                        name: '$projectName.name'
                    }
                },

                ID: {
                    $addToSet: {
                        _id : '$_id',
                        name: '$ID'
                    }
                },
                deliverMan: {
                    $addToSet: {
                        _id : '$deliverMan',
                        name: '$deliverMan'
                    }
                }

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                ID   : {
                    $filter: {
                        input: '$ID',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                deliverMan   : {
                    $filter: {
                        input: '$deliverMan',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = shippingNote.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getcostApportionmentFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var buildingSchema=mongoose.Schemas.Building;
        var building = models.get(req.session.lastDb, 'building', buildingSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
            {
                $project: {
                    _id                  : 1,
                    name                 : 1
                }
            },
            {
                $group: {
                    _id: null,
                    building: {
                        $addToSet: {
                            _id : '$_id',
                            name: '$name'
                        }
                    }
                }
            }, {
                $project: {
                    building   : {
                        $filter: {
                            input: '$building',
                            as   : 'element',
                            cond : notNullQuery
                        }
                    }
                }
            }];

        aggregation = building.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result.length ? result[0] : {};
            res.status(200).send(result);
        });
    };

    this.getOemOutNoteFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var oemOutNoteSchema = mongoose.Schemas.oemOutNote;
        var oemOutNote = models.get(req.session.lastDb, 'oemOutNote', oemOutNoteSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}, {$ne: ['$$element.name', NaN]}]};

        pipeLine = [
        {
            $match: {
                _type: 'oemOutNote'
            }
        },
        {
            $lookup: {
                from        : 'GoodsNote',
                localField  : 'oemNote',
                foreignField: '_id',
                as          : 'oemNote'
            }
        }, 
        {
            $project: {
                oemNote   : {$arrayElemAt: ['$oemNote', 0]},
                trips: 1       
            }
        },
        {
            $project: {
                'oemNote.order': '$oemNote.order',
                trips: 1
            }
        },
        {
            $lookup: {
                from: 'Order',
                localField: 'oemNote.order',
                foreignField: '_id',
                as: 'oemNote.order'
            }
        },
        {
            $project: {
                'oemNote.order': {$arrayElemAt: ['$oemNote.order', 0]},
                trips: 1
            }
        },
        {
            $lookup: {
                from: 'building',
                localField: 'oemNote.order.building',
                foreignField: '_id',
                as: 'oemNote.order.building'
            }
        },
        {
            $project: {
                building: {$arrayElemAt: ['$oemNote.order.building', 0]},
                trips: 1
            }
        },
        {
            $project: {
                projectName: '$building.name',
                trips: 1
            }
        },
        {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName',
                        name: '$projectName'
                    }
                },

                trips: {
                    $addToSet: {
                        _id: '$_id',
                        name: '$trips'
                    }
                }

            }
        }, {
            $project: {     

                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                trips: {
                    $filter: {
                        input: '$trips',
                        as: 'element',
                        cond: notNullQuery
                    }
                }
                
            }
        }];

        aggregation = oemOutNote.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

    this.getProduceMonitoringFilters = function (req, res, next) {
        var lastDB = req.session.lastDb;
        var daySheetSchema = mongoose.Schemas.daySheet;
        var daySheet = models.get(req.session.lastDb, 'daySheet', daySheetSchema);
        var pipeLine;
        var aggregation;

        var notNullQuery = {$and: [{$ne: ['$$element.name', null]}, {$ne: ['$$element.name', '']}]};

        pipeLine = [
        {
            $lookup: {
                from        : 'building',
                localField  : 'building',
                foreignField: '_id',
                as          : 'projectName'
            }
        }, {
            $project: {
                projectName   : {$arrayElemAt: ['$projectName', 0]},
                orderNumber : 1           
            }
        }, {
            $group: {
                _id: null,

                projectName: {
                    $addToSet: {
                        _id : '$projectName._id',
                        name: {$concat: ['$projectName.name']}
                    }
                },

                orderNumber: {
                    $addToSet: {
                        _id : '$orderNumber',
                        name: '$orderNumber'
                    }
                }

            }
        }, {
            $project: {                
                projectName   : {
                    $filter: {
                        input: '$projectName',
                        as   : 'element',
                        cond : notNullQuery
                    }
                },

                orderNumber   : {
                    $filter: {
                        input: '$orderNumber',
                        as   : 'element',
                        cond : notNullQuery
                    }
                }
                
            }
        }];

        aggregation = daySheet.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result.length ? result[0] : {};

            res.status(200).send(result);
        });
    };

};

module.exports = Filters;
