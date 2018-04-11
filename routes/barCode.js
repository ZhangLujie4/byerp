var express = require('express');
var router = express.Router();
var authStackMiddleware = require('../helpers/checkAuth');
var barCodeHandler = require('../handlers/barCode');

module.exports = function (models) {
    var handler = new barCodeHandler(models);
    router.use(authStackMiddleware);
    
    router.get('/getById', handler.getById);
    router.get('/getByOrderRowId/:orderRowId', handler.getByOrderRowId);
    router.get('/getBarcodeInfo/:barid',handler.getBarcodeInfo);
    router.post('/putBarCodeScanInfo',handler.putBarCodeScanInfo);
    router.post('/findByCondition',handler.findByCondition);
    router.post('/getWorkLoadOfDay',handler.getWorkLoadOfDay);
    router.post('/getBarList/:groupid',handler.getBarList);
    router.post('/getGoodsOutBarList/:groupid', handler.getGoodsOutBarList);
   // router.post('/deleteBarScanInfoOnSvr/:barid',handler.deleteBarScanInfoOnSvr);
    return router;
};
