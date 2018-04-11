module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var chargeItems;
    var processContents;

    chargeItems = {
        _id          : false,
        id           : false,
        quantity     : {type: Number, default: 0},
        chargeItem   : {type: String, default: ''},
        unit         : {type: String, default: ''},
        price        : {type: Number, default: 0}
    };

    processContents = {
        _id              : false,
        id               : false,
        quantity         : {type: Number, default: 0},
        processContent   : {type: String, default: ''},
        unit             : {type: String, default: ''},
        processType      : {type: String, default: ''},
        price            : {type: Number, default: 0}
    };

    var processDetailsSchema = mongoose.Schema({
        projectName      : {type: ObjectId, ref: 'Opportunities', default: null},
        workNumber       : {type: String, default: ''},
        chargeItems      : [chargeItems],
        processContents  : [processContents],
        fillDate         : {type: Date},
        completePercent  : {type: Number},
        projectDepCost   : {type: Number},
        processCost      : {type: Number},
        operator         : {type: String, default: ''},
        isDeclare        : {type: Boolean, default: false}
        
    }, {collection: 'processDetails'});

    mongoose.model('processDetails', processDetailsSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.ProcessDetail = processDetailsSchema;
})();
