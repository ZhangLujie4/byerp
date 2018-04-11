var express = require('express');
var router = express.Router();
var taxHandler = require('../handlers/tax');

module.exports = function (models) {
    var handler = new taxHandler(models);

    router.get('/', handler.getForView);
    
    router.post('/', handler.create);
    router.patch('/:id', handler.update);
    router.get('/:viewType', function (req, res, next) {
        var viewType = req.params.viewType;
        switch (viewType) {
            case 'form':
                handler.getById(req, res, next);
                break;
            default:
                handler.getForView(req, res, next);
        }
    });

    router.delete('/:id', handler.delete);

    return router;
};
