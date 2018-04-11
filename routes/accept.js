/**
 * Created by admin on 2017/6/26.
 */
var express = require('express');
var router = express.Router();
var AcceptHandler = require('../handlers/accept');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.ACCEPT;
    var handler = new AcceptHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/', handler.getAccept);
    router.post('/', handler.create);
    router.patch('/:_id', handler.acceptUpdate);
    router.patch('/updateById', handler.updateById);
    router.delete('/:_id', handler.removeAccept);
    router.get('/getAccept', handler.getForDd);
    router.get('/getAcceptId', handler.getById);
    return router;
};
