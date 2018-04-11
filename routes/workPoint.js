var express = require('express');
var router = express.Router();
var workPointHandler = require('../handlers/workPoint');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new workPointHandler(models);

    router.use(authStackMiddleware);

    router.get('/', handler.getForView);


    
    router.post('/', handler.create);
    router.patch('/:id', handler.update);

    router.delete('/:id', handler.delete);

    return router;
};
