module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var workPointSchema = mongoose.Schema({
        employee: {type:ObjectId, ref:'Employees',  default:null },
        point: {type: Number},
        date: {type: Date},
        status: {type: String},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
        
    }, {collection: 'workPoints'});

    mongoose.model('workPoint', workPointSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.workPoint = workPointSchema;
})();
