
var express = require('express');
var router = express.Router();
var AcceptHandler = require('../handlers/bankFinance');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.BANKINFO;
    var handler = new AcceptHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);
    router.get('/', handler.getBankInfo);
    router.patch('/:_id', handler.Update);

    return router;
};
