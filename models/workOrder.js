module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var chargeItems;
    var processContents;

    chargeItems = {
        _id          : {type: ObjectId, ref: 'chargeItems', default: null},
        id           : false,
        quantity     : {type: Number, default: 0},
        chargeItem   : {type: String, default: ''},
        unit         : {type: String, default: ''},
        price        : {type: Number, default: 0}
    };

    processContents = {
        _id              : {type: ObjectId, ref: 'processContents', default: null},
        id               : false,
        quantity         : {type: Number, default: 0},
        processContent   : {type: String, default: ''},
        unit             : {type: String, default: ''},
        processType      : {type: String, default: ''},
        price            : {type: Number, default: 0}
    };

    var workOrdersSchema = mongoose.Schema({
        isApproval     : {type: Boolean, default: false},
        projectName    : {type: ObjectId, ref: 'Opportunities', default: null},
        workNumber     : {type: String, default: ''},
        chargeItems    : [chargeItems],
        processGroup   : {type: String, default: ''},
        processContents: [processContents],
        operatorNumber : {type: Number, default: 0},
        fillDate       : {type: Date, default: Date.now},
        operator       : {type: String, default: ''},
        factoryCost    : {type: Number},
        groupCost      : {type: Number},
        factoryProfit  : {type: Number}
        
    }, {collection: 'workOrders'});

    mongoose.model('workOrders', workOrdersSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.WorkOrder = workOrdersSchema;
})();
