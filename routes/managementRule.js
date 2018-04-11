var express = require('express');
var router = express.Router();
var managementRuleHandler = require('../handlers/managementRule');

module.exports = function (models) {
    var handler = new managementRuleHandler(models);

    router.get('/', handler.getForView);

    router.post('/', handler.create);
    router.patch('/:id', handler.update);

    router.delete('/:id', handler.delete);
    router.delete('/', handler.bulkRemove);

    return router;
};
