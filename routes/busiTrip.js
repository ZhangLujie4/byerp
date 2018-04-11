var busiTripHandler = require('../handlers/busiTrip');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new busiTripHandler(models);
    var moduleId = MODULES.BUSITRIP;
    var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);

    router.get('/', accessStackMiddleware, handler.getByView);
    router.get('/getEmployee', accessStackMiddleware, handler.getEmployeeById);
    router.post('/', accessStackMiddleware, handler.create);
    router.patch('/', accessStackMiddleware, handler.putchBulk);
    router.patch('/:_id', accessStackMiddleware, handler.patch);

    router.delete('/:_id',accessStackMiddleware,  handler.remove);
    router.delete('/',accessStackMiddleware, handler.bulkRemove);

     return router;
};