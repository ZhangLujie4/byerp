var express = require('express');
var router = express.Router();
var GoodsNoteHandler = require('../handlers/oemNotes');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models, event) {
    var handler = new GoodsNoteHandler(models, event);

    router.post('/', handler.create);
    router.post('/oemOutCreate', handler.oemOutCreate);
    
    router.get('/', handler.getForView);
    router.get('/:id', handler.getForView);

    router.delete('/', handler.bulkRemove);

    return router;
};
