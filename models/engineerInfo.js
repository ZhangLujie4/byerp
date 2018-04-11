module.exports = (function () {
    var mongoose = require('mongoose');
	var ObjectId = mongoose.Schema.Types.ObjectId;
    var engineerInfoSchema = mongoose.Schema({
        name: String,
        quality: {type: String},
        issArea: {type: Number},
        amount : {type: Number},
        StartDate: {type: Date},
        EndDate: {type: Date},
        pmr: {type: String},
        pmv: {type: String},
        technicalPerson: {type: String},
        cancelDate: {type: Date},
        fileStatus: {type: String},
        materialMember: {type: String},
        securityOfficer: {type: String},
        qualityInspector: {type: String},
        constructionWorker: {type: String},
        informationOfficer: {type: String},
        address: {
        	province : {type: String, default: ''},
            city     : {type: String, default: ''},
            district : {type: String, default: ''},
            zip      : {type: String, default: ''},
        },
        constructionUnit: {type: String},
        supervisionUnit : {type: String},
        contractUnit    : {type: String},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status: {type: String},
        isDelete: {type: Boolean, default: false}
    }, {collection: 'engineerInfo'});

    mongoose.model('engineerInfo', engineerInfoSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.engineerInfo = engineerInfoSchema;
})();
