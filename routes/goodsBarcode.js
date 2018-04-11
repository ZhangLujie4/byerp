var express = require('express');
var router = express.Router();
var GoodsReturnHandler = require('../handlers/goodsBarcode');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.GOODSBARCODE;
    var handler = new GoodsReturnHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/', handler.getByViewType);

    router.post('/', handler.createGoodsBarcode);

    router.patch('/:_id', handler.goodsBarcodeUpdate);

    router.patch('/', handler.allOpinionUpdate);

    router.delete('/', handler.bulkRemove);

    return router;
};
