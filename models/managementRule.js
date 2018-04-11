module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var managementRuleSchema = mongoose.Schema({
        categoryTex         : {type: String},
        categoryNum         : {type: Number},
        number              : {type: Number},
        content             : {type: String},
        penalty             : {type: String},
        status              : {type: String},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'managementRule'});

    mongoose.model('managementRule', managementRuleSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.managementRule = managementRuleSchema;
})();
