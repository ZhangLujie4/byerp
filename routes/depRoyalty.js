/**
 * Created by wmt on 2017/7/25.
 */
var express = require('express');
var router = express.Router();
var Handler = require('../handlers/depRoyalty');

module.exports = function (models, event) {
    var handler = new Handler(models, event);

    router.post('/', handler.create);
    router.get('/', handler.getByViewType);
    router.patch('/:id', handler.updateOnlySelectedFields);
    router.delete('/', handler.bulkRemove);

    return router;
};
