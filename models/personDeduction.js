module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var personDeductionSchema = mongoose.Schema({
        year            : {type: Number,default: 0},
        month           : {type: Number,default: 0},
        employee        : {type: ObjectId, ref: 'Employees', default: null},
        deductionName   : {type: String,default: ''},
        amount          : {type: Number,default: 0},
        comment         : {type: String,default: ''},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status: {type: String}
    }, {collection: 'personDeduction'});

    mongoose.model('personDeduction', personDeductionSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.personDeduction = personDeductionSchema;
})();
    