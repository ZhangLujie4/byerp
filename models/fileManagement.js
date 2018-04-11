module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var fileManagementSchema = mongoose.Schema({
        certificate  : {type: ObjectId, ref: 'Certificate', default: null},
        reason    : {type: String, default: ''},
        borrowDate : {type: Date},
        returnDate : {type: Date},
        borrower   : {
            name: {type: String, default: ''},
            ID  : {type: String, default: ''},
            phone:{type: String, default: ''}
        },
	    borrowDepartment: {type: ObjectId, ref: 'Department', default: null},
        days: {type: Number},
        fees: {type: Number},
        expectedDate: {type: Date},
        status: {type: String},
        isDelete: {type: Boolean, default: false},
        createdBy   :{
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy   :{
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
        }, {collection: 'fileManagement'});

    mongoose.model('fileManagement', fileManagementSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.fileManagement = fileManagementSchema;
})();