var dailyReportHandler = require('../handlers/dailyReport');
var express = require('express');
var router = express.Router();
//检验权限
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new dailyReportHandler(models);

    //TODO 这里有点问题
    router.use(authStackMiddleware);

    router.get('/', handler.getList);

    router.get('/:id', handler.getUserList);

    router.post('/', handler.create);
    router.patch('/:id', handler.patchM);

    router.delete('/', handler.remove);

    return router;
};