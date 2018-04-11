var express = require('express');
var router = express.Router();
var CertificateHandler = require('../handlers/Certificate');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new CertificateHandler(models);
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();

    router.get('/getOneHistory/:id', handler.getOneHistory);
    router.get('/getReturnInfo', handler.getReturnInfo);
    router.get('/', handler.getForView);
    
    router.patch('/return/:id', handler.returnCertificate);
    router.patch('/:id', handler.update);
    router.post('/uploadFiles',multipartMiddleware, handler.uploadFile);
    router.post('/borrowAll', handler.borrowAll);
    router.post('/borrow', handler.borrow);
    router.post('/', handler.create);

    router.delete('/:id',handler.remove);
    router.delete('/',handler.bulkRemove);

    return router;
};
