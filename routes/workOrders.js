var express = require('express');
var router = express.Router();
var WorkOrdersHandler = require('../handlers/workOrders');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.WORKORDERS;
    var handler = new WorkOrdersHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);


    router.get('/getFilterValues', handler.getFilterValues);

    router.get('/', handler.getList);

    router.get('/getOpportunitie', authStackMiddleware, handler.getOpportunitie);

    router.get('/getApprovalOrder', authStackMiddleware, handler.getApprovalOrder);

    router.get('/getWorkOrder', authStackMiddleware, handler.getWorkOrder);

    router.get('/getProcess', authStackMiddleware, handler.getProcess);

    router.post('/', handler.createWorkOrder);
 
    router.post('/uploadFiles', accessStackMiddleware, multipartMiddleware, handler.uploadFile);

    router.patch('/:_id', handler.workOrderUpdate);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
