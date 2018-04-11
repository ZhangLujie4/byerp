var stampApplicationHandler = require('../handlers/stampApplication');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new stampApplicationHandler(models);
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();

    router.use(authStackMiddleware);
    router.get('/:id', handler.getById);
    router.get('/', handler.getForView);

    router.patch('/:id', handler.update);
    
    router.post('/affirmApprove/:id', handler.affirmApprove);
    router.post('/uploadFiles',multipartMiddleware, handler.uploadFile);
    router.post('/', handler.create);

    router.delete('/:id',handler.remove);
    router.delete('/',handler.bulkRemove);

    return router;
};
