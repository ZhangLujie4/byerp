module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var taxSchema = new mongoose.Schema({
        level               : {type: Number, default: 0},
        low                 : {type: Number, default: 0},
        high                : {type: Number, default: 0},        
        rate                : {type: Number, default: 0},
        countDeduction      : {type: Number, default: 0},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status: {type: String}
    }, {collection: 'tax'});

    mongoose.model('tax', taxSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.tax = taxSchema;
})();
