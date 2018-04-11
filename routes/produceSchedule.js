var express = require('express');
var router = express.Router();
var ProduceScheduleHandler = require('../handlers/produceSchedule');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.PRODUCESCHEDULE;
    var handler = new ProduceScheduleHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);


    router.get('/', handler.getList);

    router.get('/getOrderNumber', authStackMiddleware, handler.getOrderNumber);

    router.post('/', handler.createProduceSchedule);
 
    router.post('/uploadFiles', accessStackMiddleware, multipartMiddleware, handler.uploadFile);

    router.patch('/:_id', handler.produceScheduleUpdate);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
