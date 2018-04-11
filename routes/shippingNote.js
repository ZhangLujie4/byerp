var shippingNoteHandler = require('../handlers/shippingNote.js');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new shippingNoteHandler(models);

    router.use(authStackMiddleware);

    router.get('/', handler.getForView);
    router.get('/:_id', handler.getById);
    router.post('/:_id', handler.confirm);
    router.patch('/:_id', handler.update);
    router.delete('/', handler.bulkRemove);

     return router;
};
