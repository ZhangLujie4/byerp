var express = require('express');
var router = express.Router();
var ProjectHandler = require('../handlers/designBook');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
module.exports = function (models, event) {
    'use strict';
    var handler = new ProjectHandler(models, event);

    var moduleId = MODULES.DESIGNBOOK;

    var accessStackMiddleWare = require('../helpers/access')(moduleId, models);

    router.get('/getProject',accessStackMiddleWare,handler.getProject);
    router.get('/', accessStackMiddleWare, handler.getByViewType);
    router.get('/:id', accessStackMiddleWare, handler.getById);
    router.post('/', accessStackMiddleWare, handler.create);
    router.patch('/:id', accessStackMiddleWare, handler.updateOnlySelectedFields);
    router.delete('/:id', accessStackMiddleWare, handler.remove);

    return router;
};

