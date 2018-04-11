var express = require('express');
var router = express.Router();
var OrderReckonsHandler = require('../handlers/orderReckons');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.ORDERRECKONS;
    var handler = new OrderReckonsHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);


    router.get('/getFilterValues', handler.getFilterValues);

    router.get('/', handler.getList);

    router.post('/', handler.createOrderReckon);
 
    router.post('/uploadFiles', accessStackMiddleware, multipartMiddleware, handler.uploadFile);

    router.patch('/:_id', handler.orderReckonUpdate);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
