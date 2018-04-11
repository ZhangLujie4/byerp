var express = require('express');
var router = express.Router();
var ProduceMonitoringHandler = require('../handlers/produceMonitoring');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.PRODUCEMONITORING;
    var handler = new ProduceMonitoringHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/getDetails', multipartMiddleware, handler.getDetails);

    router.get('/getDays', handler.getDays);

    router.get('/', handler.getByViewType);

    router.post('/', handler.createDaySheet);

    router.delete('/', handler.bulkRemove);

    return router;
};
