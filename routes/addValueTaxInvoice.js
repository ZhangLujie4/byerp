var express = require('express');
var router = express.Router();
var InvoiceHandler = require('../handlers/addValueTaxInvoice');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models, event) {
    'use strict';

    var handler = new InvoiceHandler(models, event);
    var moduleId = MODULES.MAKEINVOICE;
    var accessStackMiddleWare = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);
    router.get('/', handler.getInvoice);
    router.patch('/:_id', handler.Update);
    router.post('/', accessStackMiddleWare, handler.create);
    router.delete('/:_id', handler.remove);

    return router;
};
