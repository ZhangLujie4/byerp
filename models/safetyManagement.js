module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var safetyManagementSchema = mongoose.Schema({
        classify    : {type: ObjectId, ref: 'safetyManClassify', default: null},
        content     : {type: String},
        attachments : {type: Array, default: []},
        remark      : {type: String},
        createdBy   : {
            user:  {type: ObjectId, ref: 'Users', defalut: null},
            date:  {type: Date}
        },
        editedBy    : {
            user:  {type: ObjectId, ref: 'Users', defalut: null},
            date:  {type: Date}
        },
        approveMan  : {type: ObjectId, ref: 'Employees', default: null},
        status      : {type: String},
        isApproved  : {type: Boolean, defalut: false},
        isDelete    : {type: Boolean, default: false}
    }, {collection: 'safetyManagement'});

    mongoose.model('safetyManagement', safetyManagementSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.safetyManagement = safetyManagementSchema;
})();

