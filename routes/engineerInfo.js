var express = require('express');
var router = express.Router();
var engineerInfoHandler = require('../handlers/engineerInfo');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models) {
    var handler = new engineerInfoHandler(models);
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();

    router.use(authStackMiddleware);

    router.get('/engineerManager', handler.getEngManagerById);
    router.get('/jobForeman', handler.getJobForemanById);
    router.get('/checkSituation', handler.getCheckSituById);
    router.get('/:id/jobForeman', handler.getJobForeman);
    router.get('/:id/engineerManager', handler.getEngManager);
    router.get('/:id/checkSituation', handler.getCheckSitu);
    router.get('/:id', handler.getById);
    router.get('/', handler.getForView);
    
    router.patch('/engineerManager/:id', handler.putchEngManager);
    router.patch('/jobForeman/:id', handler.putchJobForeman);
    router.patch('/', handler.putchBulk);
    router.patch('/:id', handler.putchModel);

    router.post('/jobForeman', handler.createJobForeman);
    router.post('/engineerManager', handler.createEngManager);
    router.post('/checkSituation', handler.createCheckSitu);
    router.post('/checkSituation/uploadFiles',multipartMiddleware, handler.uploadFile);
    router.post('/', handler.create);

    router.delete('/engineerManager/:id', handler.removeEngManager);
    router.delete('/jobForeman/:id', handler.removeJobForeman);
    router.delete('/checkSituation', handler.removeCheckSitu);
    router.delete('/:id', handler.remove);
    router.delete('/', handler.bulkRemove);

    return router;
};
