module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var taxFreeSchema = new mongoose.Schema({
        deductible          : {type: Number, default: 0},
        base                : {type: Number, default: 0},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },
        status: {type: String}
    }, {collection: 'taxFree'});

    mongoose.model('taxFree', taxFreeSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.taxFree = taxFreeSchema;
})();
