/**
 * Created by wmt on 2017/7/25.
 */
var express = require('express');
var router = express.Router();
var Handler = require('../handlers/royaltyDetails');

module.exports = function (models, event) {
    var handler = new Handler(models, event);

    router.get('/', handler.getForView);
    router.get('/:id', handler.getForView);
    router.patch('/:id', handler.updateOnlySelectedFields);
    router.post('/', handler.create);
    router.delete('/', handler.bulkRemove);
    return router;
};
