var certificateHistoryHandler = require('../handlers/certificateHistory');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new certificateHistoryHandler(models);
    var moduleId = MODULES.BONUSTYPE;
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);

    router.get('/', handler.getList);



    return router;
};
