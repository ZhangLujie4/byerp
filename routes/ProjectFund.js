var express = require('express');
var router = express.Router();
var ProjectFundHandler = require('../handlers/ProjectFund');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
module.exports = function (models, event) {
    'use strict';
    var handler = new ProjectFundHandler(models, event);

    router.use(authStackMiddleware);
    router.get('/', handler.getForView);

    return router;
};