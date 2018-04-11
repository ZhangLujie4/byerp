module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var workCentre = {
        _id          : false,
        id           : false,
        name         : {type: String, default: ''},
        code         : {type: String, default: ''},
        area         : {type: Number, default: 0},
        count        : {type: Number, default: 0},
        processCost  : {type: Number, default: 0}
    };

    var daySheetSchema = mongoose.Schema({
        building     : {type: ObjectId, ref: 'building', default: null},
        orderNumber  : {type: String, default: ''},
        day          : {type: Date, default: null},
        workCentre   : [workCentre],
        inventory    : {type: Number, default: 0},
        totalProcess : {type: Number, default: 0},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }
        
    }, {collection: 'daySheet'});

    mongoose.model('daySheet', daySheetSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.daySheet = daySheetSchema;
})();
