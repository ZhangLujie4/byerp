var express = require('express');
var router = express.Router();
var ProjectHandler = require('../handlers/designProject');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
module.exports = function (models, event) {
    'use strict';
    var handler = new ProjectHandler(models, event);

    var moduleId = MODULES.DESIGNPROJECT;
    var accessStackMiddleWare = require('../helpers/access')(moduleId, models);


    router.get('/', accessStackMiddleWare, handler.getByViewType);

    router.get('/getForDd', handler.getForDd);
    router.get('/:id', accessStackMiddleWare, handler.getById);
    router.post('/', accessStackMiddleWare, handler.create);
    router.post('/uploadFiles', accessStackMiddleWare, multipartMiddleware,handler.uploadFile);
    router.patch('/:id', accessStackMiddleWare, handler.updateOnlySelectedFields);
    router.delete('/:id', accessStackMiddleWare, handler.remove);



    return router;
};
