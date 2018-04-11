/**
 * Created by wmt on 2017/7/21.
 */
var express = require('express');
var router = express.Router();
var Handler = require('../handlers/marketSettings');

module.exports = function (models, event) {

    var handler = new Handler(models, event);

    router.delete('/', handler.bulkRemove);

    router.get('/crawler', handler.crawler);
    router.get('/autoSettings', handler.autoSettings);
    router.get('/', handler.getByViewType);
    router.post('/', handler.create);
    router.get('/getForDd', handler.getForDd);

    return router;
};
