var express = require('express');
var router = express.Router();
var DesignRecHandler = require('../handlers/designRec');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.DESIGNREC;
    var handler = new DesignRecHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);


    router.get('/getFilterValues', handler.getFilterValues);

    router.get('/', handler.getList);

    router.post('/', handler.createDesignRec);

    //router.get('/getgendanOrders', authStackMiddleware, handler.getGendanOrders);
 
    router.post('/uploadFiles', accessStackMiddleware, multipartMiddleware, handler.uploadFile);

    router.patch('/:_id', handler.designRecUpdate);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
