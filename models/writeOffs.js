module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var barCode = {
        _id          : false,
        id           : false,
        barId        : {type: ObjectId, ref: 'barCode', default:null},
        wareOpinion  : {type: String, default: ''},
        handlOpinion : {type: String, default: ''}
    };

    var oemOrder = {
        _id          : false,
        id           : false,
        product      : {type: String, default:null},
        quantity     : {type: Number},
        orderRowId   : {type: ObjectId, ref: 'orderRows', default: null},
        wareOpinion  : {type: String, default: ''},
        handlOpinion : {type: String, default: ''}
    };

    var writeOffsSchema = mongoose.Schema({
        projectId       : {type: ObjectId, ref: 'building', default: null},
        barCode         : [barCode],
        oemOrder        : [oemOrder],
        deliverNumber   : {type: ObjectId, ref: 'shippingNote', default: null},
        orderNumber     : {type: String, default: ''},
        quantity        : {type: Number, default: 0},
        reason          : {type: String, default: ''},       
        stockReturnId   : {type: ObjectId, ref: 'stockReturns', default:null},
        type            : {type: String, default: ''},
        state           : {type: String, default: ''},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }
        
    }, {collection: 'writeOffs'});

    mongoose.model('writeOffs', writeOffsSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.WriteOffs = writeOffsSchema;
})();
