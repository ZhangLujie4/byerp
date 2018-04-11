module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var produceScheduleSchema = mongoose.Schema({
        projectId       : {type: ObjectId, ref: 'buildingContract', default: null},
        orderNumber     : {type: String, default: ''},
        sequence        : {type: Number, default: 0},
        produceType     : {type: String, default: ''},
        scheduleDate    : {type: String, default: ''},
        isApproval      : {type: Boolean, default: false},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }
        
    }, {collection: 'produceSchedule'});

    mongoose.model('produceSchedule', produceScheduleSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.ProduceSchedule = produceScheduleSchema;
})();
