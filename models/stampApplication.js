module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var stamp = {
        _id         : false,
        id          : {type: ObjectId, ref: 'Stamp', default: null},
        name        : {type: String},
        process     : {type: Array, default: []}
    }

    var stampApplicationSchema = mongoose.Schema({
        ID          : {type: Number},
        projectName : {type: ObjectId, ref: 'Opportunities', default: null},
        stamp       : [stamp],
        fileNumber  : {type: Number},
        pageNumber  : {type: Number},
        comment     : {type: String},
        applyDate   : {type: Date},
        fileType    : {type: String},
        applyMan    : {type: ObjectId, ref: 'Employees', default: null},
        department  : {type: ObjectId, ref: 'Department', default: null},
        attachments : {type: Array, default: []},
        isSubmit    : {type: Boolean, default: false},
        isDelete: {type: Boolean, default: false},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }      
    }, {collection: 'stampApplication'});

    mongoose.model('stampApplication', stampApplicationSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.stampApplication = stampApplicationSchema;
})();

