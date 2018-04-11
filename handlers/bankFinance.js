/**
 * Created by admin on 2017/6/29.
 */
/**
 * Created by admin on 2017/6/26.
 */
/*TODO remove caseFilter methid after testing filters*/

var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var bankInfoSchema = mongoose.Schemas.BankInfo;
var bankSchema = mongoose.Schemas.Bank;
var journalEntrySchema = mongoose.Schemas.journalEntry;
var objectId = mongoose.Types.ObjectId;
var CONSTANTS = require('../constants/mainConstants');

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
    var JournalEntryHandler = require('./journalEntry');
    var _journalEntryHandler = new JournalEntryHandler(models);

    this.getBankInfo = function (req, res, next) {
        var viewType = req.query.viewType;

        switch (viewType) {
            case 'form':
                getBankInfoById(req, res, next);
                break;
            case 'list':
                getBankInfoForList(req, res, next);
                break;
            case 'forms':
                getBankById(req, res, next);
                break;
        }

    };

    function getBankInfoById(req, res, next) {
        var data = req.query;
        var bankInfo = models.get(req.session.lastDb, 'journalEntry', journalEntrySchema);

        bankInfo.findById(data.id)
            .populate('journal', '_id name date')
            .populate('account', '_id code type name account')
            .exec(function (err, task) {
                if (err) {
                    next(err);
                }
                res.status(200).send(task);
            });

    }

    function getBankById(req, res, next) {
        var data = req.query;
        var bankInfo = models.get(req.session.lastDb, 'Bank', bankSchema);

        bankInfo.findById(data.id)
            .populate('bankAccount', '_id name')
            .exec(function (err, task) {
                if (err) {
                    next(err);
                }
                console.log(task)
                res.status(200).send(task);
            });

    }

    function getBankInfoForList(req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var bank = models.get(req.session.lastDb, 'Bank', bankSchema);
        var bankInfo=models.get(req.session.lastDb, 'journalEntry', journalEntrySchema)
        sort = {'_id': 1};
        var accountId;
        var number=0;
        var total=0;
        var rightBank=[];

        bank
            .aggregate([
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        bankAccount: 1
                    }
                }
            ], function (err, result) {
                for(var i=0;i<result.length;i++){
                    accountId=result[i].bankAccount;
                    bankInfo
                        .aggregate([
                            {
                                $match:{
                                    account:objectId(accountId)
                                }
                            },
                            {
                                $match: {
                                    restore     : '未还原'

                                }
                            },{
                                $lookup: {
                                    from        : 'journals',
                                    localField  : 'journal',
                                    foreignField: '_id',
                                    as          : 'journal'
                                }
                            },{
                                $lookup: {
                                    from        : 'chartOfAccount',
                                    localField  : 'account',
                                    foreignField: '_id',
                                    as          : 'account'
                                }
                            }, {
                                $project: {
                                    _id                 : 1,
                                    debit               : 1,
                                    credit              : 1,
                                    journal       : {$arrayElemAt: ['$journal', 0]},
                                    account       : {$arrayElemAt: ['$account', 0]}
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
                                    debit                 :'$root.debit',
                                    credit                :'$root.credit',
                                    journal               :'$root.journal',
                                    account               :'$root.account',
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
                        ] ,function (err, results) {
                            for(var j=0;j<results.length;j++){
                                var str=results[j].journal.name;
                                var s=str.indexOf('定存');
                                if(s>0){
                                    rightBank.push(results[j]);
                                    total=total+1
                                }
                            }
                            number=number+1;
                            if(number==result.length){
                                var response={};
                                response.total=total;
                                response.data = {};
                                response.data = rightBank;
                                res.status(200).send(response);
                            }

                        });

                }


            });

    };

    this.Update = function (req, res, next) {
        bankInfoUpdate(req, res, next);

    };

    function bankInfoUpdate (req, res, next) {
        var _id = req.params._id;
        var data = req.body;
        var fileName = data.fileName;

        createBankInfo(req, res, next);
        delete data._id;
        delete data.createdBy;
        delete data.fileName;
        delete data.datas;


        models.get(req.session.lastDb, 'journalEntry', journalEntrySchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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

    function createBankInfo (req, res, next) {
        var body = req.body.datas;

        updateBankAdd(req,res,next);

        var data = {
            currency      : CONSTANTS.CURRENCY_USD,
            journal       : body.journal,
            amount: 0,
            date  : body.date,
            state:"未到单",
            states:"未审核",
            restore:'已还原'
        };
        if(body.debit>0){
            data.amount=body.debit;
        }
        if(body.credit>0){
            data.amount=body.credit;
        }

        _journalEntryHandler.create(data, req.session.lastDb, function () {
        }, req.session.uId);
    };

    function updateBankAdd(req, res, next){
        var data={};
        var accountId=req.body.datas.account;
        var bankDebit=req.body.datas.debit;
        var bankCredit=req.body.datas.credit;
        var Bank = models.get(req.session.lastDb, 'Bank', bankSchema);
        Bank
            .aggregate([
                {
                    $match: {
                        bankAccount            : objectId(accountId)

                    }
                },
                {
                    $project: {
                        _id                : 1,
                        name               : 1,
                        credit             : 1,
                        debit              : 1,
                        incomeNumber       : 1,
                        expendNumber       : 1
                    }
                }
            ], function (err, result) {
                var credit;
                var debit;
                var incomeNumber;
                var expendNumber;
                var bankId;
                bankId=result[0]._id;
                credit=result[0].credit;
                debit=result[0].debit;
                incomeNumber=result[0].incomeNumber;
                expendNumber=result[0].expendNumber;
                if(bankDebit>0) {
                    incomeNumber=incomeNumber + 1;
                }
                if(bankCredit>0){
                    expendNumber=expendNumber+1;
                }
                credit=credit*1+bankCredit*1;
                debit=debit*1+bankDebit*1;
                data={
                    incomeNumber:incomeNumber,
                    expendNumber:expendNumber,
                    credit:credit,
                    debit:debit
                };
                models.get(req.session.lastDb, 'Bank', bankSchema).findByIdAndUpdate(bankId, {$set: data}, {new: true}, function (err, result) {

                    if (err) {
                        return next(err);
                    }

                    res.send(200, {success: 'Tasks updated', notes: result.notes, sequence: result.sequence});
                });

            });

    };

}

module.exports = Module;

