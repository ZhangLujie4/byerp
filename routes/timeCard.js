var timeCardHandler = require('../handlers/timeCard');
var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (models) {
    var handler = new timeCardHandler(models);
    // var moduleId = MODULES.BUSITRIP;
    // var accessStackMiddleware = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);

    router.get('/exportToXlsx', handler.exportToXlsx);
    router.get('/:id', handler.getMonthData);
    router.get('/',  function(req, res, next){
        var id = req.query.id;
        if(id){
            handler.getById(req, res, next);
        }
        else{
            handler.getForView(req, res, next);
        }
    });
    
    
    router.post('/importFile/:datekey',multipartMiddleware, handler.importFile);
    // router.post('/importFile',multipartMiddleware, function(res,req,next){
    //     res.send("hahah");
    // });

    return router;
};