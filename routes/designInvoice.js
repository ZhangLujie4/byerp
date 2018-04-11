
var express = require('express');
var router = express.Router();
var taxHandler = require('../handlers/designInvoice');
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

    router.get('/', handler.getInfo);
    router.post('/', handler.create);
    router.patch('/:_id', handler.Update);
    router.delete('/:_id', handler.remove);


    return router;
};
