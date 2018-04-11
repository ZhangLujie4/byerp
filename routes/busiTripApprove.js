var busiTripApproveHandler = require('../handlers/busiTripApprove');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new busiTripApproveHandler(models);
    var moduleId = MODULES.BUSITRIP;
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);

    router.get('/', accessStackMiddleware, handler.getByView);
    router.patch('/:_id', accessStackMiddleware, handler.patch);

     return router;
};