module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var minimumWageSchema = new mongoose.Schema({
        wage                : {type: Number, default: 0},
        communication       : {type: Number, default: 0},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status: {type: String}
    }, {collection: 'minimumWage'});

    mongoose.model('minimumWage', minimumWageSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.minimumWage = minimumWageSchema;
})();
