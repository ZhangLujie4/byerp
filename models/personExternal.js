module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var personExternalSchema = mongoose.Schema({
        employee        : {type: ObjectId, ref: 'Employees', default: null},
        allowanceName   : {type: String,default: ''},
        amount          : {type: Number,default: 0},
        createdBy  : {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, Default: Date.now}
        },
        editedBy   :{
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status: {type: String}
    }, {collection: 'personExternal'});

    mongoose.model('personExternal', personExternalSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.personExternal = personExternalSchema;
})();
    