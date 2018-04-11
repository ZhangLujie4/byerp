var express = require('express');
var router = express.Router();
var GoodsScrapHandler = require('../handlers/goodsScrap');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.GOODSSCRAP;
    var handler = new GoodsScrapHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/', handler.getByViewType);

    router.post('/', handler.createGoodsScrap);

    router.patch('/:_id', handler.goodsScrapUpdate);

    router.patch('/', handler.allOpinionUpdate);

    router.delete('/', handler.bulkRemove);

    return router;
};
