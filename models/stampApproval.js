module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var comment = {
        _id     : false,
        statusInd : {type: Number, default: 0},
        date    : {type: Date},
        opinion : {type: String}
    };

    var stampApprovalSchema = mongoose.Schema({
        stampApplication: {type: ObjectId, ref: 'stampApplication', default: null},
        stamp: {type: ObjectId, ref: 'Stamp', default: null},
        process: {type: Array, default: []},
        // projectName : {type: ObjectId, ref: 'Opportunities', default: null},
        // fileNumber  : {type: Number},
        // pageNumber  : {type: Number},
        comment     : [comment],
        // applyDate   : {type: Date},
        // fileType    : {type: String},
        // applyMan    : {type: ObjectId, ref: 'Employees', default: null},
        // department  : {type: ObjectId, ref: 'Department', default: null},
        attachments : {type: Array, default: []},
        // processTotal: {type: Number},
        approveMan  : {type: ObjectId, ref: 'Employees', default: null},
        status      : {type: Number},
        isApproved  : {type: Boolean}
    }, {collection: 'stampApproval'});

    mongoose.model('stampApproval', stampApprovalSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.stampApproval = stampApprovalSchema;
})();

