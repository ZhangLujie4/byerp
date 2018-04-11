var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var plantWorkGroupHandler = require('../handlers/plantWorkGroup');

module.exports = function (models) {
    var handler = new plantWorkGroupHandler(models);
    router.use(authStackMiddleware);

    router.post('/createWorkGroup',handler.createWorkGroup);
    router.get('/getById', handler.getById);
    router.get('/dismissWorkGroup/:groupid',handler.dismissWorkGroup);
    router.get('/getWorkGroup/:workid',handler.getWorkGroup);
    router.get('/test/:workid',handler.test);
    return router;
};
