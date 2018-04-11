var express = require('express');
var router = express.Router();
var OrderApprovalHandler = require('../handlers/orderApproval');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.ORDERAPPROVAL;
    var handler = new OrderApprovalHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);


    router.get('/getFilterValues', handler.getFilterValues);

    router.get('/', handler.getApprovalList);

    router.get('/getOpportunitie', authStackMiddleware, handler.getOpportunitie);

    router.post('/', handler.createWorkOrder);
 
    router.post('/uploadFiles', accessStackMiddleware, multipartMiddleware, handler.uploadFile);

    router.patch('/:_id', handler.workOrderUpdate);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
