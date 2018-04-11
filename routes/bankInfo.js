/**
 * Created by admin on 2017/6/29.
 */
/**
 * Created by admin on 2017/6/26.
 */
var express = require('express');
var router = express.Router();
var AcceptHandler = require('../handlers/bankInfo');
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
    router.post('/', handler.createBankInfo);
    router.post('/createBank', handler.createBank);
    router.get('/getById',  handler.getById);
    router.patch('/:_id', handler.Update);
    router.delete('/:_id', handler.removeBankInfo);
    router.delete('/deleteBank/:_id', handler.removeBank);
    return router;
};
