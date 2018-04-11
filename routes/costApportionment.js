var express = require('express');
var router = express.Router();
var costApportionmentsHandler = require('../handlers/costApportionment');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models, event) {
    var Handler = new costApportionmentsHandler(models, event);
    var moduleId = MODULES.COSTAPPORTIONMENT;
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);

    router.get('/', Handler.getForView);

    return router;
};
