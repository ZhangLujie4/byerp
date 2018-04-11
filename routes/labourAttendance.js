
var express = require('express');
var router = express.Router();
var labourAttendanceHandler = require('../handlers/labourAttendance');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var handler = new labourAttendanceHandler(models, event);

    router.use(authStackMiddleware);

    router.post('/generate', handler.generate);

    return router;
};
