
var express = require('express');
var router = express.Router();
var taxHandler = require('../handlers/makeInvoice');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.MAKEINVOICE;
    var handler = new taxHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/', handler.getInvoice);
    router.post('/', handler.createTaxSave);
    router.post('/createData', handler.create);
    router.patch('/update', handler.Update);
    return router;
};
