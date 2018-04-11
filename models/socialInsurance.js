module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var socialInsuranceSchema = mongoose.Schema({
        name: {type: String},
        ID  : {type: String},
        socialInsuranceNumber: {type: String},
        year: {type: Number},
        month: {type: Number},

        endowmentCol: {type: Number},
        endowmentInd: {type: Number},

        unemployeeCol: {type: Number},
        unemployeeInd: {type: Number},

        medicalCol  : {type: Number},
        medicalInd  : {type: Number},

        maternityCol: {type: Number},
        maternityInd: {type: Number},

        injuryCol  : {type: Number},
        injuryInd  : {type: Number},

        cityHealth : {type: Number},

        department: {type: ObjectId, ref: 'Department', default: null},
        employee: {type: ObjectId, ref: 'Employees', default: null},
        departmentClass: {type: Number},

        chargeStatus: {type: Boolean,default: false},
        chargeDate: {type: Date}

    }, {collection: 'socialInsurance'});

    mongoose.model('socialInsurance', socialInsuranceSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.socialInsurance = socialInsuranceSchema;
})();
