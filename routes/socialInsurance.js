var socialInsuranceHandler = require('../handlers/socialInsurance');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new socialInsuranceHandler(models);
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();

    router.use(authStackMiddleware);

    router.get('/', handler.getForView);
    router.post('/importFile/:id', multipartMiddleware, handler.importFile);
    router.post('/importCityHealth/:id', multipartMiddleware, handler.importCityHealth);

    return router;
};
