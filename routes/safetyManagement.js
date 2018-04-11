var safetyManagementHandler = require('../handlers/safetyManagement');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new safetyManagementHandler(models);
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();

    router.use(authStackMiddleware);

    router.get('/getClassifyDd', handler.getClassifyDd);
    router.get('/', handler.getForView);

    router.patch('/:id', handler.update);

    router.post('/createClassify', handler.createClassify);
    router.post('/', handler.create);
    router.post('/uploadFiles',multipartMiddleware, handler.uploadFile);

    router.delete('/:id',handler.remove);
    router.delete('/',handler.bulkRemove);

    return router;
};
