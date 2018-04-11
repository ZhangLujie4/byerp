var express = require('express');
var router = express.Router();
var AluorderApprovalHandler = require('../handlers/aluorderApproval');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.ALUORDERAPPROVAL;
    var handler = new AluorderApprovalHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);


    router.get('/', handler.getByViewType);

    router.post('/', handler.createAluorderApproval);

    router.patch('/:_id', handler.aluorderApprovalUpdate);

    router.patch('/', handler.aluorderApprovalCheck);

    router.delete('/:_id', handler.remove);

    router.delete('/', handler.bulkRemove);

    return router;
};
