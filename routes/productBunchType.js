var productBunchTypeHandler = require('../handlers/productBunchType');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new productBunchTypeHandler(models);

    router.use(authStackMiddleware);
    router.get('/', handler.getForView);

    router.patch('/:id', handler.update);

    router.post('/', handler.create);

    router.delete('/:id',handler.remove);
    router.delete('/',handler.bulkRemove);

    return router;
};
