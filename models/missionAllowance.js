module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var missionAllowanceSchema = mongoose.Schema({
        ID                  : Number,
        name                : {type: ObjectId, ref: 'Employees', default: null},
        Department          : {type: ObjectId, ref: 'Department', default: null},
        jobPosition         : {type: ObjectId, ref: 'JobPosition', default: null},
        carLicense          : {type: String},
        allowanceStandard   : {type: Number, default: 0},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status: {type: String}
    }, {collection: 'missionAllowance'});

    mongoose.model('missionAllowance', missionAllowanceSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.missionAllowance = missionAllowanceSchema;
})();
