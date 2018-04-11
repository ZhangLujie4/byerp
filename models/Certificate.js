module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var certificateSchema = mongoose.Schema({
        certNo: {type: String, default: ''},
        name: {type: String, default:'', required: true},
        genre: {type: String, default: ''},
        holder: {
            name: {type: String, default: ''},
            ID  : {type: String, default: ''},
            phone: {type: String, default: ''}
        },
        receiptDate: {type: Date},
        startDate: {type: Date},
        issuer: {type: String, default: ''},
        filedDate: {type: Date},
        validDate: {type: Date},
        remark: {type: String,default: ''},
        status: {type: String},
        attachments : {type: Array, default: []},
        isDelete: {type: Boolean, default: false},
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        level: {type: Number},
        dataStatus: {type: String, default: 'new'}
    }, {collection: 'Certificate'});

    mongoose.model('Certificate', certificateSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.Certificate = certificateSchema;
})();
