module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var checkSituationSchema = mongoose.Schema({
        engineerInfo    : {type: ObjectId, ref: 'engineerInfo', default: null},
        year            : {type: Number},
        month           : {type: Number},
        rule            : {type: ObjectId, ref: 'managementRule', default: null},
        rectification   : {type: String},
        penalty         : {type: Number},
        focus           : {type: String},
        remark          : {type: String},
        attachments     : {type: Array, default:[]},
        inspector       : {type: String},
        inspectDate     : {type: Date},
        createdBy: {
            user        : {type: ObjectId, ref: 'Users', default: null},
            date        : {type: Date, default: Date.now}
        },
        editedBy: {
            user        : {type: ObjectId, ref: 'Users', default: null},
            date        : {type: Date, default: Date.now}
        },
        approveMan      : {type: ObjectId, ref: 'Employees', default: null},
        status          : {type: String},
        timeStamp       : {type: Number},
        isDelete        : {type: Boolean, default: false}
    }, {collection: 'checkSituation'});

    mongoose.model('checkSituation', checkSituationSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.checkSituation = checkSituationSchema;
})();
