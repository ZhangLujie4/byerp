var express = require('express');
var router = express.Router();
var OemReturnHandler = require('../handlers/oemBarcode');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.OEMBARCODE;
    var handler = new OemReturnHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/getByWriteOff', handler.getByWriteOff);

    router.get('/', handler.getByViewType);

    router.post('/', handler.createOemBarcode);

    router.patch('/:_id', handler.oemBarcodeUpdate);

    router.patch('/', handler.allOpinionUpdate);

    router.delete('/', handler.bulkRemove);

    return router;
};
