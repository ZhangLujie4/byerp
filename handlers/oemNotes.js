var oemNotes = function (models, event) {
    'use strict';

    var mongoose = require('mongoose');
    var oemNoteSchema = mongoose.Schemas.oemNote;
    var OrderRowsSchema = mongoose.Schemas.OrderRow;
    var locationSchema = mongoose.Schemas.locations;
    var OrderSchema = mongoose.Schemas.Order;
    var oemOutNoteSchema = mongoose.Schemas.oemOutNote;

    var orderRowsService = require('../services/orderRows')(models);
    var pageHelper = require('../helpers/pageHelper');
    var FilterMapper = require('../helpers/filterMapper');

    var async = require('async');
    var _ = require('lodash');
    var path = require('path');

    this.create = function (req, res, next) {
        var oemNote = models.get(req.session.lastDb, 'oemNote', oemNoteSchema);
        var body = req.body;
        var user = req.session.uId;
        var dbName = req.session.lastDb;
        var oemNotes;

        if (body.status && body.status.received) {
            if (!body.status) {
                body.status = {};
            }
            
            body.status.receivedOn = body.date ? new Date(body.date) : new Date();
            body.status.receivedById = user;
        }

        oemNotes = new oemNote(body);

        oemNotes.createdBy.user = user;

        oemNotes.save(function (err, result) {

            if (err) {
                return next(err);
            }

            oemNote.findById(result._id).populate('order', 'shippingMethod shippingExpenses').exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);

            });
        });
    };

    this.getForView = function (req, res, next) {
        var viewType = req.query.viewType;
        var id = req.query.id || req.params.id;

        if (id && id.length >= 24) {
            return getGoodsNoteById(req, res, next);
        } else if (id && id.length < 24) {
            return res.status(400).send();
        }

        switch (viewType) {
            case 'list':
            case 'thumbnails':
                getGoodsNotesFilter(req, res, next);
                break;
            case 'form':
                getGoodsNoteById(req, res, next);
                break;
            default:
                getGoodsNotesFilter(req, res, next);
                break;
        }
    };

    function getGoodsNotesFilter(req, res, next) {
        var query = req.query;
        var optionsObject = {$and: []};
        var sort = {};
        var paginationObject = pageHelper(query);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var filterMapper = new FilterMapper();
        var key;

        var oemNote = models.get(req.session.lastDb, 'oemNote', oemNoteSchema);

        optionsObject.$and.push({_type: 'oemNote'});

        if (query && query.sort) {
            key = Object.keys(query.sort)[0].toString();
            query.sort[key] = parseInt(query.sort[key], 10);
            sort = query.sort;
        } else {
            sort = {'createdBy.date': -1};
        }

        if (query.filter && typeof query.filter === 'object') {
            optionsObject.$and.push(filterMapper.mapFilter(query.filter, query.contentType)); // caseFilter(query.filter);
        }

        oemNote.aggregate([{
            $match: {
                archived: {$ne: true}
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
                shippinglist : 1,
                reason   : 1,
                description : 1
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
                building       : {$arrayElemAt: ['$building', 0]},
                _type           : 1,
                date            : 1,
                createdBy       : 1,
                shippinglist    : 1,
                reason          : 1,
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
                shippinglist   : 1,
                description    : 1,
                reason         : 1,
                'building._id' : '$building._id',
                'building.name': '$building.name',
            }
        }, {
            $match: optionsObject
        }, {
            $group: {
                _id  : null,
                total: {$sum: 1},
                root : {$push: '$$ROOT'}
            }
        }, {
            $unwind: '$root'
        }, {
            $project: {
                _id      : '$root._id',
                name     : '$root.name',
                status   : '$root.status',
                warehouse: '$root.warehouse',
                createdBy: '$root.createdBy',
                date     : '$root.date',
                total    : 1,
                approved : '$root.status.approved',
                shippinglist : '$root.shippinglist',
                description : '$root.description',
                reason   : '$root.reason',
                building : '$root.building'
            }
        }, {
            $sort: sort
        }, {
            $skip: skip
        }, {
            $limit: limit
        }])
            .exec(function (err, result) {
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
            });
    }

    function getGoodsNoteById(req, res, next) {
        var id = req.query.id || req.params.id;
        var oemNote = models.get(req.session.lastDb, 'oemNote', oemNoteSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
        var Location = models.get(req.session.lastDb, 'location', locationSchema);
        var query;

        if (id.length < 24) {
            return res.status(400).send();
        }

        query = oemNote.findById(id);

        query
            .populate('createdBy.user')
            .populate('editedBy.user')
            .populate('shippingMethod')
            .exec(function (err, result) {

                if (err) {
                    return next(err);
                }

                var Ids = result.orderRows.map(function (element) {
                    return element.orderRowId;
                });

                result = result.toJSON();
                

                OrderRows.find({$and: [{_id: {$in: Ids}}]})
                    .populate('order')
                    .exec(function (err, orderRows) {
                        var orderRowsIds;

                        if (err) {
                            return next(err);
                        }

                        orderRowsIds = orderRows.map(function (element) {
                            return element._id;
                        });

                        oemNote.find({
                            'orderRows.orderRowId': {$in: orderRowsIds}
                        }, {
                            'orderRows': 1,
                            status     : 1
                        })
                            .populate('orderRows.locationsReceived.location')
                            .exec(function (err, docs) {
                                if (err) {
                                    return next(err);
                                }

                                orderRows = orderRows.map(function (element) {
                                    return element.toJSON();
                                });

                                orderRows.forEach(function (el) {
                                    el.shipped = 0;
                                    el.selectedQuantity = 0;

                                    docs.forEach(function (element) {
                                        var elementOrderRow = _.find(element.orderRows, {orderRowId: el._id});
                                        var quantity = 0;

                                        if (elementOrderRow) {
                                            quantity = elementOrderRow.quantity;
                                            if (element._id.toString() === result._id.toString()) {
                                                el.selectedQuantity = quantity;
                                                el.Planqty = elementOrderRow.Planqty || 0;
                                                el.locationsReceived = elementOrderRow.locationsReceived;
                                                el.params = elementOrderRow.parameters;
                                                el.cost = elementOrderRow.cost;
                                                el.unitPrice = elementOrderRow.unitPrice;
                                                el.weightPrice = elementOrderRow.weightPrice;
                                                el.unit = elementOrderRow.unit;
                                            }

                                            if (element.status.shipped) {
                                                el.shipped += quantity;
                                                el.selectedQuantity = 0;
                                            }
                                        }
                                    });
                                    el.quantity -= (el.shipped + el.selectedQuantity);
                                });

                                result.orderRows = orderRows;

                                Order.findById(result.order)
                                    .exec(function (err, doc) {
                                        if (err) {
                                            return next(err);
                                        }

                                        result.order = doc;

                                        res.status(200).send(result);
                                    });

                            });
                    });

            });
    }

    this.bulkRemove = function (req, res, next) {
        var options = {
            dbName: req.session.lastDb,
            ids   : req.body.ids,
            req   : req
        };
        bulkRemove(options, res, next);
    };

    function bulkRemove(options, res, next) {
        var req = options.req;
        var oemNote = models.get(req.session.lastDb, 'oemNote', oemNoteSchema);
        var ids = options.ids || [];

        oemNote.remove({_id: {$in: ids}}, function (err, result) {
            if (err) {
                return next(err);
            }

            if (typeof  res.status === 'function') {
                return res.status(200).send({success: 'Removed success'});
            }

            res();
        });
    }

    this.oemOutCreate = function(req, res, next) {
        var oemNote = models.get(req.session.lastDb, 'oemNote', oemNoteSchema);
        var oemOutNote = models.get(req.session.lastDb, 'oemOutNote', oemOutNoteSchema);
        var body = req.body.body;
        var orderRows = req.body.orderRows;
        var id = req.body.id;
        var user = req.session.uId;
        var dbName = req.session.lastDb;
        var oemOutNotes;

        oemOutNotes = new oemOutNote(body);
        oemOutNotes.save(function(err, result){
            if(err){
                return next(err);
            }
            oemNote.findByIdAndUpdate(id, {orderRows: orderRows, 'status.approved' : true}, { new: true }, function(err, response) {
                if (err) {
                    return next(err);
                }
                res.status(200).send('success');
            });
        });
    };
};

module.exports = oemNotes;
