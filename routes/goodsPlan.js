var express = require('express');
var router = express.Router();
var goodsPlanHandler = require('../handlers/goodsPlan');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    var handler = new goodsPlanHandler(models, event);

    router.get('/', handler.getByViewType);

    router.get('/getByWorkflows', handler.getByWorkflows);

    router.get('/:id', handler.getById);

    router.post('/importexcel/:id', multipartMiddleware, handler.importexcel);
    router.post('/updateNum', handler.updateGoodsInNum);
    router.post('/allocate', handler.allocate);

    router.patch('/updateWorkflow', handler.updateWorkflow);

    router.patch('/:id', handler.putchModel);

    router.delete('/', handler.bulkRemove);

    return router;
};
