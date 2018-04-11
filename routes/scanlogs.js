var express = require('express');
var router = express.Router();
var ScanlogsHandler = require('../handlers/scanlogs');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.SCANLOGS;
    var handler = new ScanlogsHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/', handler.getList);

    router.post('/createBarcode', handler.createBarcode);

    router.post('/', handler.createScanlog);

    router.patch('/:_id', handler.scanlogUpdate);

    router.delete('/', handler.bulkRemove);

    return router;
};
