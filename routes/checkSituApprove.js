var checkSituApproveHandler = require('../handlers/checkSituApprove');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new checkSituApproveHandler(models);
 

    router.use(authStackMiddleware);

    router.get('/',  handler.getList);

    router.patch('/', handler.putchBulk);
    router.patch('/:_id', handler.patch);


     return router;
};