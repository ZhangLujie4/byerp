var express = require('express');
var router = express.Router();
var BuildingContractHandler = require('../handlers/buildingContract');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.BUILDINGCONTRACT;
    var handler = new BuildingContractHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);


    router.get('/getBuildings', handler.getBuildings);

    router.get('/getCustomers', authStackMiddleware, handler.getCustomers);

    router.get('/getSoldProducts', authStackMiddleware, handler.getSoldProducts);

    router.get('/', handler.getList);

    router.post('/', handler.createBuildingContract);

    router.post('/uploadFiles', accessStackMiddleware, multipartMiddleware, handler.uploadFile);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    router.patch('/:_id', handler.buildingContractUpdate);

    return router;
};
