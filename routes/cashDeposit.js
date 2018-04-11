
var express = require('express');
var router = express.Router();
var taxHandler = require('../handlers/cashDeposit');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.CASHDEPOSIT;
    var handler = new taxHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.post('/', handler.create);
    router.get('/', handler.getDeposit);
    router.get('/getForDd',  handler.getForDd);
    router.get('/getById',  handler.getInfoById);
    router.patch('/:_id', handler.Update);
    router.get('/return', handler.createReturn);
    router.delete('/:_id', handler.remove);



    return router;
};
