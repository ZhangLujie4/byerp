module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var productBunchTypeSchema = mongoose.Schema({
        name    : {type: String, default: ''},
        price   : {type: Number, default: 0},
        supplier: {type: ObjectId, ref: 'Customers', default: null},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status: {type: String}
    }, {collection: 'productBunchTypes'});

    mongoose.model('productBunchType', productBunchTypeSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.productBunchType = productBunchTypeSchema;
})();
