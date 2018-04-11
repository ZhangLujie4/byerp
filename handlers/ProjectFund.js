
module.exports = function (models, event) {
    'use strict';

    var FilterMapper = require('../helpers/filterMapper');
    var mongoose = require('mongoose');

    var accessRoll = require('../helpers/accessRollHelper.js')(models);
    var CONSTANTS = require('../constants/mainConstants.js');
    var Mailer = require('../helpers/mailer');
    var Uploader = require('../services/fileStorage/index');
    var pathMod = require('path');

    var fs = require('fs');
    var path = require('path');
    var ProjectSchema = mongoose.Schemas.Project;
    var InvoiceSchema = mongoose.Schemas.Invoice;
    var journalEntrySchema = mongoose.Schemas.journalEntry;
    var addedValueTaxInvoiceSchema=mongoose.Schemas.addValueTaxInvoice;
    var ExpensesInvoiceSchema = mongoose.Schemas.expensesInvoice;
    var objectId = mongoose.Types.ObjectId;
    var mailer = new Mailer();
    var uploader = new Uploader();

    var exporter = require('../helpers/exporter/exportDecorator');
    var exportMap = require('../helpers/csvMap').Project;

    var _ = require('underscore');
    var async = require('async');
    var moment = require('../public/js/libs/moment/moment');
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var filterMapper = new FilterMapper();


    function getPmrList(req,res,next) {
        var data = req.query;
        var sort = {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var filter = data.filter || {};
        var projectType=filter.type?{projectType:filter.type}:{};
        var Project=models.get(req.session.lastDb, 'Project', ProjectSchema);
        var addedValueTaxInvoice=models.get(req.session.lastDb, 'addedValueTaxInvoice', addedValueTaxInvoiceSchema);
        var ExpensesInvoice=models.get(req.session.lastDb, 'expensesInvoice', ExpensesInvoiceSchema);
        sort={_id:-1};
        Project
            .aggregate([
                {
                    $match:projectType
                },
                {
                    $project:{
                        _id:1,
                        pmr:1
                    }
                },
                {
                    $lookup: {
                        from        : 'Employees',
                        localField  : 'pmr',
                        foreignField: '_id',
                        as          : 'pmrInfo'
                    }
                },
                {
                    $project:{
                        _id:1,
                        pmr:1,
                        pmrInfo:{$arrayElemAt: ['$pmrInfo', 0]}
                    }
                },
                {
                    $group: {
                        _id  :  '$pmr',
                        project : {$push: '$$ROOT'}
                    }
                },
                {
                    $sort: sort
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }
            ],function (err,pmrResult) {
                if(err){
                    next(err);
                }
                var resultList=[];
                var response={};
                if(pmrResult.length) {
                    async.each(pmrResult, function (pmrObj, pmrCb) {
                        var pmr=pmrObj.project[0].pmrInfo;
                        var receipt=0;
                        var spend=0;
                        async.each(pmrObj.project, function (project, projectCb) {
                            var projectId = project._id;

                            function getReceipt(ReceiptCb) {
                                addedValueTaxInvoice
                                    .aggregate([
                                        {
                                            $match: {
                                                project: projectId,
                                                _type:'addValueTaxInvoice'
                                            }
                                        }
                                    ], function (err, InvoiceResult) {
                                        async.each(InvoiceResult, function (InvoiceObj, InvoiceCb) {
                                            receipt=receipt+InvoiceObj.amount;
                                            InvoiceCb(null)
                                        },function () {
                                            ReceiptCb(null,receipt)
                                        })
                                    })
                            }

                            function getSpend(SpendCb) {
                                ExpensesInvoice
                                    .aggregate([
                                        {
                                            $match: {
                                                project: projectId,
                                                _type:'expensesInvoice'
                                            }
                                        }
                                    ],function (err,InvoiceResult) {
                                        async.each(InvoiceResult,function (InvoiceObj, InvoiceCb) {
                                            spend=spend+ InvoiceObj.amount;
                                            InvoiceCb(null)
                                        },function () {
                                            SpendCb(null,spend)
                                        })
                                    })
                            }

                            async.parallel([getReceipt,getSpend],function (err,result) {
                                projectCb(null)
                            })

                        },function () {
                            var datas={};
                            datas.totalReceipt=receipt;
                            datas.totalSpend=spend;
                            datas.pmr=pmr;
                            resultList.push(datas);
                            pmrCb(null)
                        })
                    },function () {
                        response.data=resultList;
                        response.total=pmrResult.length;
                        res.status(200).send(response);
                    });
                }else{
                    response.data=resultList;
                    response.total=pmrResult.length;
                    res.status(200).send(response);
                }
            })

    }

    function getPmrDetail(req,res,next) {
        var data = req.query;
        var filter = data.filter || {};
        var pmrId=filter.pmrId;
        var sort = {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var Project=models.get(req.session.lastDb, 'Project', ProjectSchema);
        var journalEntry = models.get(req.session.lastDb, 'journalEntry', journalEntrySchema);
        var addedValueTaxInvoice=models.get(req.session.lastDb, 'addedValueTaxInvoice', addedValueTaxInvoiceSchema);
        var ExpensesInvoice=models.get(req.session.lastDb, 'expensesInvoice', ExpensesInvoiceSchema);
        sort={invoiceDate:-1};

        Project
            .aggregate([
                {
                    $match:{
                        pmr:objectId(pmrId)
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

                    $project:{
                        _id          :1,
                        name         :1,
                        pmr          :{$arrayElemAt:['$pmr',0]}
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
                        name               :'$root.name',
                        pmr                :'$root.pmr',
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
            ],function (err,projectResult) {
                if(err){
                    next(err)
                }
                var projectList=[];
                var response={};
                projectList.push({project:projectResult[0]});
                async.each(projectResult,function (projectObj,projectCb) {
                    var receive=0;
                    var spend=0;
                    var projectId=projectObj._id;

                    function getReceive(receiveCb) {
                        addedValueTaxInvoice
                            .aggregate([
                                {
                                    $match: {
                                        project: projectId,
                                        _type:'addValueTaxInvoice'
                                    }
                                }
                            ], function (err, InvoiceResult) {
                                async.each(InvoiceResult, function (InvoiceObj, InvoiceCb) {
                                    receive=receive+InvoiceObj.amount;
                                    InvoiceCb(null)
                                },function () {
                                    receiveCb(null,receive)
                                })
                            })
                    }


                    function getSpend(SpendCb) {
                        ExpensesInvoice
                            .aggregate([
                                {
                                    $match: {
                                        project: projectId,
                                        _type:'expensesInvoice'
                                    }
                                }
                            ],function (err,InvoiceResult) {
                                async.each(InvoiceResult,function (InvoiceObj, InvoiceCb) {
                                    spend=spend+ InvoiceObj.amount;
                                    InvoiceCb(null)
                                },function () {
                                    SpendCb(null,spend)
                                })
                            })
                    }

                    async.parallel([getReceive,getSpend],function (err,result) {
                        projectList.push({project:projectObj,receive:receive,spend:spend});
                        projectCb(null)
                    })
                },function () {
                    response.data=projectList;
                    response.total=projectResult.length;
                    res.status(200).send(response);
                })
            })

    }

    function getProjectDetail(req,res,next) {
        var data = req.query;
        var sort = {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var filter = data.filter || {};
        var id=filter.projectId;
        var Project = models.get(req.session.lastDb, 'Project', ProjectSchema);
        var Invoice = models.get(req.session.lastDb, 'Invoice', InvoiceSchema);
        sort={_id:-1};
        Project
            .aggregate([
                {
                    $match:{
                        _id:objectId(id)
                    }
                },
                {
                    $lookup: {
                        from        : 'Customers',
                        localField  : 'customer',
                        foreignField: '_id',
                        as          : 'customer'
                    }
                },
                {
                    $project:{
                        name    :1,
                        customer: {$arrayElemAt: ['$customer', 0]}
                    }
                }
            ],function (err,projectResult) {
                if(err){
                    next(err)
                }
                var response={};
                var projectId = projectResult[0]._id;
                Invoice
                    .aggregate([
                        {
                            $match:{
                                project:projectId
                            }
                        },
                        {
                            $project:{
                                _id          :1,
                                _type        :1,
                                invoiceDate  :1,
                                amount       :1,
                                realAmount   :1,
                                invoiceMold  :1
                            }
                        },
                        {
                            $sort: sort
                        }, {
                            $skip: skip
                        }, {
                            $limit: limit
                        }
                    ],function (err,invoiceResult) {
                        if(err){
                            next(err)
                        }
                        var invoiceList=[];
                        invoiceList.push({invoice:'invoice',pro:projectResult[0]});
                        async.each(invoiceResult,function (invoiceObj,invoiceCb) {
                            invoiceList.push({project:projectResult[0],invoice:invoiceObj});
                            invoiceCb(null)
                        },function () {
                            response.data=invoiceList;
                            response.total=invoiceResult.length;
                            res.status(200).send(response);
                        })
                    })

            })

    }

    this.getForView=function (req,res,next) {
        var data = req.query;
        var filter = data.filter||{};

        if(filter.pmrId){
            getPmrDetail(req,res,next)
        } else if(filter.projectId){
            getProjectDetail(req,res,next)
        } else  {
            getPmrList(req,res,next)
        }

    };


};
