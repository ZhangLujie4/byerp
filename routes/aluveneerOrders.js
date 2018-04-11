var express = require('express');
var router = express.Router();
var AluveneerOrdersHandler = require('../handlers/aluveneerOrders');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.ALUVENEERORDERS;
    var handler = new AluveneerOrdersHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/getAluOrder', handler.getAluOrder);

    router.get('/getCurrentOrders', handler.getCurrentOrders);

    router.get('/getById', handler.getById);
    
    router.get('/', handler.getByViewType);

    router.post('/importexcel', multipartMiddleware, handler.importexcel);

    router.post('/importGraph/:id', multipartMiddleware, handler.importGraph);
 
    router.post('/uploadFiles', accessStackMiddleware, multipartMiddleware, handler.uploadFile);

    router.post('/', handler.createAluveneerOrder);

    router.patch('/:_id', handler.aluveneerOrderUpdate);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
