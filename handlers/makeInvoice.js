var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var projectInvoiceSchema = mongoose.Schemas.projectInvoice;
var taxSaveSchema = mongoose.Schemas.taxSave;
var enterpriseSchema = mongoose.Schemas.enterprise;
var objectId = mongoose.Types.ObjectId;

var _ = require('underscore');
var async = require('async');

var Module = function (models, event) {
    'use strict';

    var validator = require('../helpers/validator');

    var fs = require('fs');
    var path = require('path');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();
    var FilterMapper = require('../helpers/filterMapper');

    this.getInvoice = function (req, res, next) {
        var viewType = req.query.viewType;
        var data=req.query;
        if(data.id && viewType=='list'){
            getById(req, res, next);
        } else if(data.id && viewType=='form') {
            getInvoiceById(req, res, next);
        } else{
            getForList(req, res, next);
        }

    };

    function  getById(req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        sort = {'_id': 1};
        var id;
        id=data.id;
        var projectInvoice = models.get(req.session.lastDb, 'projectInvoice', projectInvoiceSchema);
        projectInvoice.
        aggregate([
            {
                $match: {
                    project                : objectId(id),
                    state                  :'normal'
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
                    from        : 'Invoice',
                    localField  : 'invoice',
                    foreignField: '_id',
                    as          : 'invoice'
                }
            },
            {
                $project: {
                    _id            : 1,
                    project        : {$arrayElemAt: ['$project', 0]},
                    invoice        : {$arrayElemAt: ['$invoice', 0]},
                    invoiceTax     : 1,
                    rate           : 1,
                    payer          : 1,
                    name           : 1,
                    amount         : 1,
                    addValueTax    : 1,
                    cost           : 1,
                    day            : 1,
                    sell           : 1,
                    receive        : 1,
                    profit         : 1,
                    type           : 1,
                    dataType       : 1,
                    makeSell       : 1,
                    sellTax        : 1

                }
            },{
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
                    _id                   :'$root._id',
                    project               :'$root.project',
                    invoice               :'$root.invoice',
                    invoiceTax            :'$root.invoiceTax',
                    rate                  :'$root.rate',
                    payer                 :'$root.payer',
                    name                  :'$root.name',
                    amount                :'$root.amount',
                    addValueTax           :'$root.addValueTax',
                    cost                  :'$root.cost',
                    day                   :'$root.day',
                    sell                  :'$root.sell',
                    receive               :'$root.receive',
                    profit                :'$root.profit',
                    type                  :'$root.type',
                    dataType              :'$root.dataType',
                    makeSell              :'$root.makeSell',
                    sellTax               :'$root.sellTax',
                    total                 :1
                }
            },
            {
                $sort: sort
            }, {
                $skip: skip
            }, {
                $limit: limit
            }
        ],function (err, results) {
            var response={};
            if (err) {
                return next(err);
            }
            var count;
            count = results[0] && results[0].total ? results[0].total : 0;

            response.total = count;
            response.data =results;

            res.status(200).send(response);
        });

    }

    function getForList (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var projectInvoice = models.get(req.session.lastDb, 'projectInvoice', projectInvoiceSchema);
        sort = {'sequence': 1};
        projectInvoice
            .aggregate([
                {
                    $match:{
                        state       :'normal'
                    }
                },
                {
                    $lookup: {
                        from        : 'Project',
                        localField  : 'project',
                        foreignField: '_id',
                        as          : 'projects'
                    }
                },
                {
                    $lookup: {
                        from        : 'Invoice',
                        localField  : 'invoice',
                        foreignField: '_id',
                        as          : 'invoice'
                    }
                },
                {
                    $project: {
                        _id            : 1,
                        projects       : {$arrayElemAt: ['$projects', 0]},
                        invoice        : {$arrayElemAt: ['$invoice', 0]},
                        project        :1
                    }
                },

                {
                    $group: {
                        _id  : '$project',
                        root : {$push: '$$ROOT'}
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

                count = result.length;
                response.total = count;
                response.data = result;
                res.status(200).send(response);
            });

    }

    function getInvoiceById(req, res, next) {
        var data = req.query;
        var invoice = models.get(req.session.lastDb, 'projectInvoice', projectInvoiceSchema);
        var enterprise=models.get(req.session.lastDb,'enterprise,',enterpriseSchema);
        var response={};
        invoice.findById(data.id)
            .populate('invoice', '_id name payer invoiceDate amount realAmount tax rate type realPayer ')
            .populate('project', '_id name ')
            .populate('payer', '_id fullName ')
            .exec(function (err, task) {
                if (err) {
                    next(err);
                }
                var taxSave=models.get(req.session.lastDb, 'taxSave', taxSaveSchema);
                taxSave
                    .aggregate([{
                      $match:{
                          invoice:data.id,
                          state:'normal'
                      }
                    },
                        {
                            $project: {
                                _id             : 1,
                                amount          : 1,
                                gist            : 1,
                                rate            : 1,
                                name            : 1,
                                tax             : 1,
                                invoice         : 1
                            }
                        }
                    ], function (err, result) {
                        if (err) {
                            return next(err);
                        }

                        var invoice=task.invoice;
                        if(invoice) {
                            invoice = invoice.toJSON();
                            enterprise.findById(invoice.payer)
                                .exec(function (err, pay) {
                                    if (err) {
                                        next(err);
                                    }
                                    response.invoiceInfo = task;
                                    response.taxSave = result;
                                    response.payer = pay;
                                    res.status(200).send(response);

                                })
                        } else{
                            response.invoiceInfo = task;
                            response.taxSave = result;
                            res.status(200).send(response);
                        }
                    });


            });

    }

    this.createTaxSave = function (req, res, next) {
        var axCategories = models.get(req.session.lastDb, 'taxSave', taxSaveSchema);
        var body = req.body;
        var newtax;
        var taxSaveId=body.taxSaveId;
        if(body.del){
            var data={};
            data.editedBy = {
                date: new Date(),
                user: req.session.uId
            };
            data.state='delete';

            models.get(req.session.lastDb, 'taxSave', taxSaveSchema).findByIdAndUpdate(taxSaveId, {$set: data}, {new: true}, function (err, result) {

                res.send(200, {});
            });
        } else  if(taxSaveId){

            var datas={};
            datas.editedBy = {
                date: new Date(),
                user: req.session.uId
            };
            datas.state='modify';
            models.get(req.session.lastDb, 'taxSave', taxSaveSchema).findByIdAndUpdate(taxSaveId, {$set: datas}, {new: true}, function (err, result) {
                datas.invoice=body.invoice;
                datas.tax=body. tax;
                datas.name=body. name;
                datas. rate =body. rate;
                datas.gist=body. gist;
                datas.amount=body.amount;
                datas.state='normal';
                datas.createdBy = {
                    date: new Date(),
                    user: req.session.uId
                };
                newtax = new axCategories(datas);
                newtax.save(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(201).send({});
                });
            });


        } else{

            var dat={};
            dat.createdBy = {
                date: new Date(),
                user: req.session.uId
            };
            dat.invoice=body.invoice;
            dat.tax=body. tax;
            dat.name=body. name;
            dat. rate =body. rate;
            dat.gist=body. gist;
            dat.amount=body.amount;
            newtax = new axCategories(dat);
             newtax.save(function (err, result) {
             if (err) {
             return next(err);
             }

             res.status(201).send({});
             });
        }




    };

    this.Update = function (req, res, next) {
        var data = req.body;
        var _id =data._id;
        var datas={};
        var projectInvoice = models.get(req.session.lastDb, 'projectInvoice', projectInvoiceSchema);
        if(data.datass.state=='delete') {
            datas = data.datass;
            datas.editedBy = {
                date: new Date(),
                user: req.session.uId
            };

            models.get(req.session.lastDb, 'projectInvoice', projectInvoiceSchema).findByIdAndUpdate(_id, {$set: datas}, {new: true}, function (err, result) {

                res.send(200, {success: 'Tasks updated'});
            });
        } else if(data.operation && data.operation=='makeSell'){
            datas = data.datass;
            datas.createdBy = {
                date: new Date(),
                user: req.session.uId
            };
            var newInvoice;
            newInvoice=new projectInvoice(datas);
            newInvoice.save(function (err, result) {
                if (err) {
                    return next(err);
                }
            });
            var a={};
            a.makeSell='yes';
            models.get(req.session.lastDb, 'projectInvoice', projectInvoiceSchema).findByIdAndUpdate(_id, {$set: a}, {new: true}, function (err, result) {
                res.send(200, {success: 'Tasks updated'});
            });
        } else{
            datas.editedBy = {
                date: new Date(),
                user: req.session.uId
            };
            datas.payer=data.datass.payer;
            datas.name=data.datass.name;
            datas. amount=data.datass.amount;
            datas.addValueTax=data.datass.addValueTax;
            datas.cost=data.datass.cost;
            datas.day=data.datass.day;
            datas.sell=data.datass.sell;
            datas.receive=data.datass.receive;
            datas.profit=data.datass.profit;
            datas.type=data.datass.type;
            
            models.get(req.session.lastDb, 'projectInvoice', projectInvoiceSchema).findByIdAndUpdate(_id, {$set: datas}, {new: true}, function (err, result) {


                res.send(200, {success: 'Tasks updated'});
            });
        }

    };

    this.create = function (req, res, next) {
        var projectInvoice = models.get(req.session.lastDb, 'projectInvoice', projectInvoiceSchema);
        var body = req.body.data;
        var newProjectInvoice;

        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };
        newProjectInvoice = new projectInvoice(body);

        newProjectInvoice.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
        });
    };



};

module.exports = Module;
