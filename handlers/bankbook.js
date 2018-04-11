/**
 * Created by admin on 2017/6/26.
 */
/*TODO remove caseFilter methid after testing filters*/

var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var bankbookSchema = mongoose.Schemas.Bankbook;
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


    this.getAccept = function (req, res, next) {
        var viewType = req.query.viewType;

        switch (viewType) {
            case 'list':
                getBankbookForList(req, res, next);
                break;
        }

    };

    function getBankbookForList (req, res, next) {
        var data = req.query;
        var limit = parseInt(data.count, 10);
        var skip = (parseInt(data.page || 1, 10) - 1) * limit;
        var sort;
        var bankbook = models.get(req.session.lastDb, 'Bankbook', bankbookSchema);
        sort = {'acceptState': -1,'endDate': -1};

        bankbook
            .aggregate([
                {
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
                        _id             : 1,
                        journal         : {$arrayElemAt: ['$journal', 0]},
                        account         : {$arrayElemAt: ['$account', 0]},
                        debit           : 1,
                        credit          : 1,
                        amount          : 1,
                        date            : 1,
                        type            : 1
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
                        journal            :'$root.journal',
                        account            :'$root.account',
                        debit              :'$root.debit',
                        credit             :'$root.credit',
                        amount             :'$root.amount',
                        date               :'$root.date',
                        type               :'$root.type',
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

    }

}

module.exports = Module;

