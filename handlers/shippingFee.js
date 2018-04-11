var mongoose = require('mongoose');

var Module = function (models) {
    'use strict';

    var shippingNoteSchema = mongoose.Schemas.shippingNote;
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
    var async = require('async');

    this.getForView = function (req, res, next) {
        var db = req.session.lastDb;
        var shippingNote = models.get(db, 'shippingNote', shippingNoteSchema);
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var filterObj = {};
        var optionsObject = [];
        var filter = data.filter || {};
        var contentType = data.contentType || 'shippingNote';
        var filterMapper = new FilterMapper();
        var startDate=filter.date.value[0];
        var endDate=filter.date.value[1];
        if (filter) {
            delete filter.date;
            filterObj = filterMapper.mapFilter(filter, contentType); 
        }
        if (data.sort) {
            sort = data.sort;
        } else {
            sort = {'shipDate': -1};
        }

        var startKey = new Date(startDate);
        var endKey = new Date(endDate);
        startKey = startKey.getFullYear()*10000 + (startKey.getMonth()+ 1)*100 + startKey.getDate();
        endKey = endKey.getFullYear()*10000 + (endKey.getMonth()+ 1)*100 + endKey.getDate();


        shippingNote.aggregate([
            {
                $match: {
                    status:"Done"
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
                    oemNote:{$arrayElemAt:['$oemNote',0]},
                    ID: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    deliverMan:1,
                    shipDate: 1,
                    area:1,
                    price:1,
                    _type:1,
                    datekey: {$add: [{$multiply: [{$year: '$shipDate'}, 10000]}, {$multiply: [{$month: '$shipDate'}, 100]}, {$dayOfMonth: '$shipDate'}]}
                }
            },
            {
                $project:{
                    goodsNote: {$ifNull: ['$goodsOutNote', '$oemNote']},
                    ID: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    deliverMan:1,
                    shipDate: 1,
                    area:1,
                    price:1,
                    _type:1,
                    datekey: {$add: [{$multiply: [{$year: '$shipDate'}, 10000]}, {$multiply: [{$month: '$shipDate'}, 100]}, {$dayOfMonth: '$shipDate'}]}
                }
            },          
            {
                $match: {
                    datekey: {
                        $lte: endKey,
                        $gte: startKey
                    }
                }
            },
            {
                $project: {
                    
                    load: '$goodsNote.load',
                    unLoad: '$goodsNote.unLoad',
                    'goodsNote.order': '$goodsNote.order',
                    ID: 1,                    
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    deliverMan:1,
                    shipDate: 1,
                    area:1,
                    _type:1,
                    price:1
                                   
                }
            },
            {
                $lookup: {
                    from: 'Order',
                    localField: 'goodsNote.order',
                    foreignField: '_id',
                    as: 'goodsNote.order'
                }
            },
            {
                $project: {
                    load: 1,
                    unLoad: 1,              
                    'goodsNote.order': {$arrayElemAt: ['$goodsNote.order', 0]},
                    ID: 1,           
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    deliverMan:1,
                    shipDate: 1,
                    area:1,
                    _type:1,
                    price:1                                                     
                }
            },
            {
                $lookup: {
                    from: 'building',
                    localField: 'goodsNote.order.building',
                    foreignField: '_id',
                    as: 'goodsNote.order.building'
                }
            },
            {
                $project: {
                    load: 1,
                    unLoad: 1,
                    'goodsNote.order.building': {$arrayElemAt: ['$goodsNote.order.building', 0]},
                    ID: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    deliverMan:1,
                    shipDate: 1,
                    _type:1,
                    area:1,
                    price:1 
                    
                }
            },
            {
                $project: {
                    load:1,
                    unLoad:1,
                    projectName: '$goodsNote.order.building.name',
                    ID: 1,
                    license: 1,
                    fee: 1,
                    fee1: 1,
                    deliverMan:1,
                    shipDate: 1,
                    _type:1,
                    area:1,
                    price:1
                }
            },
            {
                $match: filterObj
            },       
            {
                $group: {
                    _id: null,
                    total: {$sum: 1},
                    root: {$push: '$$ROOT'}
                }
            },
            {
                $unwind: '$root'
            },
            {
                $project: {
                    load: '$root.load',
                    unLoad: '$root.unLoad',
                    projectName: '$root.projectName',
                    ID: '$root.ID',
                    license: '$root.license',
                    fee: '$root.fee',
                    fee1: '$root.fee1',
                    shipDate: '$root.shipDate',
                    deliverMan:'$root.deliverMan',
                    total: 1,
                    _type:'$root._type',
                    _id: '$root._id',
                    area:'$root.area',
                    price:'$root.price'                                   
                }
            },
            {
                $sort: sort
            }, {
                $skip: skip
            }, {
                $limit: limit
            }
            ], function(err, result){
                var count;
                var firstElement;
                var response = {};

                if (err) {
                    return next(err);
                }

                firstElement = result[0];
                count = firstElement && firstElement.total ? firstElement.total : 0;
                response.total = count;
                response.data = result;
                res.status(200).send(response);
            })
    };
};
module.exports = Module;