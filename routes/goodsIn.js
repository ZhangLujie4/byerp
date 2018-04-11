var express = require('express');
var router = express.Router();
var GoodsNoteHandler = require('../handlers/goodsInNote');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models, event) {
    var handler = new GoodsNoteHandler(models, event);

    router.get('/', handler.getForView);

    router.get('/confirmIssue', handler.confirmIssue);
    router.get('/goodsInNewspecial', handler.goodsInNewspecial);
    router.get('/goodsOutCreate', handler.goodsOutCreate);
    router.get('/goodsInNew', handler.goodsInNew);
    router.get('/getGoodsInNote', handler.getGoodsInNote);
    router.get('/NotesCancel', handler.NotesCancel);
    router.get('/:id', handler.getForView);

    router.post('/', handler.create);
    router.post('/return', handler.createReturn);
    
    router.delete('/', handler.bulkRemove);

    return router;
};
