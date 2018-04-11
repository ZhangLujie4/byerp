var express = require('express');
var router = express.Router();
var BuildingHandler = require('../handlers/building');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.BUILDING;
    var handler = new BuildingHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/getCustomers', handler.getCustomers);

    router.get('/getBuildings', handler.getBuildings);

    router.get('/', handler.getList);

    router.post('/', handler.createBuilding);

    router.patch('/:_id', handler.buildingUpdate);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
