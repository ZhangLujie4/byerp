module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var buildingSchema = mongoose.Schema({
        name            : {type: String, default: ''},
        projectManager  : {type: String, default: ''},
        customerId      : {type: ObjectId, ref: 'Customers', default: null},
        totalAmount     : {type: Number, default: 0},
        paidAmount      : {type: Number, default: 0},
        totalLoan       : {type: Number, default: 0},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }
        
    }, {collection: 'building'});

    mongoose.model('building', buildingSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.Building = buildingSchema;
})();
