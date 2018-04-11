var express = require('express');
var router = express.Router();
var Handler = require('../handlers/marketSettings');

module.exports = function (models, event) {

    var handler = new Handler(models, event);

    router.get('/', handler.getAluminumPrice);
    router.post('/', handler.createAluminumPrice);
    router.delete('/', handler.bulkRemoveAluminumPrice);

    return router;
};
