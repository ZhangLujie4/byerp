var express = require('express');
var router = express.Router();
var productParameterHandler = require('../handlers/productParameter');
var authStackMiddleware = require('../helpers/checkAuth');

module.exports = function (models) {
    var handler = new productParameterHandler(models);
    var moduleId = 103;
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);
    
    router.get('/getForDD', handler.getForDD);
    router.get('/:id', handler.getById);
    router.get('/' ,handler.getForView);

    router.post('/:id', handler.create);

    router.delete('/:id', handler.delete);

    router.patch('/formula/:id', handler.updateFormula);
    router.patch('/:id', handler.update);

    return router;
};
