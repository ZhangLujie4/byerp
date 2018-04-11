var shippingFeeHandler = require('../handlers/shippingFee.js');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new shippingFeeHandler(models);

    router.use(authStackMiddleware);

    router.get('/', handler.getForView);  

     return router;
};