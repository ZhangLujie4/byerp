module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var stampsSchema = mongoose.Schema({
        stampsCode: {type: String, default: null},
        type: String,
        name: {type:String, default: null},
        approvalProcess: String,
        startDate: {type: Date},
        endDate: {type: Date},
        destroyDate: {type: Date},
        keeper: {type: ObjectId, ref: 'Employee'},
        charger: {type: ObjectId, ref: 'Employee'},
        comment: String,
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status: {type: String}        
    }, {collection: 'Stamps'});

    mongoose.model('Stamps', stampsSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.stamp = stampsSchema;
})();