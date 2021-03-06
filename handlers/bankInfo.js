/**
 * Created by admin on 2017/6/29.
 */
/**
 * Created by admin on 2017/6/26.
 */
/*TODO remove caseFilter methid after testing filters*/

var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var bankEditSchema = mongoose.Schemas.BankEdit;
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
    this.createBank = function (req, res, next) {
        var Bank = models.get(req.session.lastDb, 'Bank', bankSchema);
        var body = req.body;
        var newBank;
        body.createdBy = {
            date: new Date(),
            user: req.session.uId
        };
        newBank = new Bank(body);

        newBank.save(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(201).send({success: 'A new Project crate success', result: result, id: result._id});
        });
    };

    this.createBankInfo = function (req, res, next) {
        var body = req.body;

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

    function getBankInfoForList (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var bank = models.get(req.session.lastDb, 'Bank', bankSchema);
        sort = {'_id': 1};

        bank
            .aggregate([
                {
                    $project: {
                        _id                : 1,
                        name               : 1,
                        credit:            1,
                        debit:1,
                        incomeNumber       :1,
                        expendNumber   :1
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
                        credit               :'$root.credit',
                        debit               :'$root.debit',
                        incomeNumber               :'$root.incomeNumber',
                        expendNumber               :'$root.expendNumber',
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

    this.getById = function (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var id;
        var accountId;
        var bank = models.get(req.session.lastDb, 'Bank', bankSchema);
        var bankInfo = models.get(req.session.lastDb, 'journalEntry', journalEntrySchema);

        var bankModel={};
        bankModel.data={};
        sort = {'_id': 1};
        id=data.id;

        bank
            .aggregate([
                {
                    $match: {
                        _id                : objectId(id)

                    }
                },
                {
                    $project: {
                        _id                : 1,
                        name               : 1,
                        bankAccount        : 1
                    }
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }
                var count;
                if (err) {
                    return next(err);
                }
                accountId=result[0].bankAccount;
                bankInfo.
                    aggregate([
                    {
                        $match: {
                            account                : objectId(accountId)

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
                            account       : {$arrayElemAt: ['$account', 0]},
                            state            :1,
                            states          :1
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
                            state                 :'$root.state',
                            states                :'$root.states',
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
                    count = results[0] && results[0].total ? results[0].total : 0;

                    response.total = count;
                    response.data = {};
                    response.data.bank=result;
                    response.data.bankInfo=results;
                    console.log(response)
                    res.status(200).send(response);
                });


            });
    };

    this.Update = function (req, res, next) {
        var viewType = req.body.viewType;

        switch (viewType) {
            case 'bankInfo':
                bankInfoUpdate(req, res, next);
                break;
            case 'bank':
                bankUpdate(req, res, next);
                break;

        }

    };

    function bankUpdate (req, res, next) {
        var _id = req.params._id;
        var data = req.body;
        var fileName = data.fileName;

        var Accept = models.get(req.session.lastDb, 'Bank', bankSchema);
        var acceptEdit=models.get(req.session.lastDb, 'BankEdit', bankEditSchema);
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
        delete data.viewType;

        models.get(req.session.lastDb, 'Bank', bankSchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

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

    function bankInfoUpdate (req, res, next) {
        var _id = req.params._id;
        var data = req.body;
        var fileName = data.fileName;

        console.log(data)
        delete data._id;
        delete data.createdBy;
        delete data.fileName;

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

    this.removeBank=function(req, res, next) {
        var _id = req.params._id;

        var Accept = models.get(req.session.lastDb, 'Bank', bankSchema);
        var acceptEdit=models.get(req.session.lastDb, 'BankEdit', bankEditSchema);
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

        models.get(req.session.lastDb, 'Bank', bankSchema).findByIdAndRemove(_id, function (err, task) {
            if (err) {
                return next(err);
            }
            res.send(200, {success: 'Success removed'});
        });
    };

    this.removeBankInfo=function(req, res, next) {
        var _id = req.params._id;
        updateBankDelete(req, res, next);
        models.get(req.session.lastDb, 'journalEntry', journalEntrySchema).findByIdAndRemove(_id, function (err, task) {
            if (err) {
                return next(err);
            }
            res.send(200, {success: 'Success removed'});
        });
    };

    function updateBankAdd(req, res, next){
        var data={};
        var accountId=req.body.account;
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
                if(req.body.debit>0) {
                    incomeNumber=incomeNumber + 1;
                }
                if(req.body.credit>0){
                    expendNumber=expendNumber+1;
                }
                credit=credit*1+req.body.credit*1;
                debit=debit*1+req.body.debit*1;
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

    function updateBankDelete(req, res, next){
        var data={};
        var Bank = models.get(req.session.lastDb, 'Bank', bankSchema);
        var bankInfo=models.get(req.session.lastDb, 'journalEntry', journalEntrySchema);
        var _id = req.params._id;

        bankInfo
            .aggregate([
                {
                    $match: {
                        _id            : objectId(_id)

                    }
                },
                {
                    $project: {
                        _id                : 1,
                        credit             : 1,
                        debit              : 1,
                        account            : 1
                    }
                }
            ], function (err, result) {
                var credit;
                var debit;
                var accountId;
                accountId=result[0].account;
                credit=result[0].credit;
                debit=result[0].debit;

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
                    ], function (err, results) {
                        var credits;
                        var debits;
                        var incomeNumber;
                        var expendNumber;
                        var bankId;
                        bankId=results[0]._id;
                        credits=results[0].credit;
                        debits=results[0].debit;
                        incomeNumber=results[0].incomeNumber;
                        expendNumber=results[0].expendNumber;
                        if(credit>0) {
                            incomeNumber=incomeNumber-1;
                        }
                        if(debit>0){
                            expendNumber=expendNumber-1;
                        }
                        credits=credits*1-credit*1;
                        debits=debits*1-debit*1;
                        data={
                            incomeNumber:incomeNumber,
                            expendNumber:expendNumber,
                            credit:credits,
                            debit:debits
                        };
                        models.get(req.session.lastDb, 'Bank', bankSchema).findByIdAndUpdate(bankId, {$set: data}, {new: true}, function (err, result) {
                            if (err) {
                                return next(err);
                            }

                        });

                    });
            });




    };
}

module.exports = Module;

