var borrowAffirmHandler = require('../handlers/borrowAffirm');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new borrowAffirmHandler(models);
 

    router.use(authStackMiddleware);

    router.get('/',  handler.getList);
    router.patch('/affirm', handler.affirmBorrow);
    router.patch('/disagree', handler.disagreeBorrow);

     return router;
};