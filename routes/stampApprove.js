var stampApproveHandler = require('../handlers/stampApprove');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new stampApproveHandler(models);
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();

    router.use(authStackMiddleware);

    router.get('/', handler.getForView);
    
    router.patch('/:id', handler.update);

    return router;
};
