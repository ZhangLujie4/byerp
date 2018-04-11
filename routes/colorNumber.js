var express = require('express');
var router = express.Router();
var ColorNumberHandler = require('../handlers/colorNumber');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.COLORNUMBER;
    var handler = new ColorNumberHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/getForDd', handler.getForDd);

    router.get('/', handler.getList);

    router.post('/', handler.createColorNumber);

    router.patch('/:_id', handler.colorNumberUpdate);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
