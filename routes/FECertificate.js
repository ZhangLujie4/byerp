/**
 * Created by admin on 2017/6/26.
 */
var express = require('express');
var router = express.Router();
var AcceptHandler = require('../handlers/FECertificate');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    'use strict';
    var moduleId = MODULES.FECERTIFICATE;
    var handler = new AcceptHandler(models, event);
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.use(accessStackMiddleware);
    router.get('/', handler.getFECertificate);
    router.post('/', handler.create);
    router.patch('/:_id', handler.FECertificateUpdate);
    router.delete('/:_id', handler.removeFECertificate);

    return router;
};
