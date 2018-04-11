var express = require('express');
var router = express.Router();
var QuotationHandler = require('../handlers/oemOrders');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models, event) {
    var handler = new QuotationHandler(models, event);
    var moduleId = MODULES.OEMORDER;
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);

    router.get('/getBySupplier', handler.getBySupplier);

    router.get('/', handler.getByViewType);
    
    router.get('/:id', handler.getById);

    router.post('/', handler.create);

    router.patch('/:id', handler.putchModel);

    router.delete('/:id', handler.remove);

    router.delete('/', handler.bulkRemove);

    router.post('/importexcel/:id', multipartMiddleware, handler.importexcel);

    return router;
};
