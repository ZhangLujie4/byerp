var express = require('express');
var router = express.Router();
var GoodsReturnHandler = require('../handlers/goodsReturn');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.GOODSRETURN;
    var handler = new GoodsReturnHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/getByBuilding', handler.getByBuilding);

    router.get('/', handler.getList);

    router.post('/', handler.createGoodsReturn);

    router.patch('/:_id', handler.goodsReturnUpdate);

    router.delete('/', handler.bulkRemove);

    return router;
};
