module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var chargeItemsSchema = mongoose.Schema({
        chargeItem : {type: String, default: ''},
        unit       : {type: String, default: ''},
        price      : {type: Number, default: 0},
        code       : {type: String, default: ''},
        status       : {type: String, default: ''},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }

        
    }, {collection: 'chargeItems'});

    mongoose.model('chargeItems', chargeItemsSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.ChargeItem = chargeItemsSchema;
})();
