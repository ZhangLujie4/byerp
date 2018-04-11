module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var plantWorkGroupSchema = mongoose.Schema({
        groupId: Number,
        members: [{type:ObjectId,ref:'Employees'}],
        leader: {type:ObjectId, ref:'Employees',  default:null },
        createAt: {type: Date, default: Date.now},
        status: {type: Boolean,default:false},
        deleteAt: {type: Date},
        workCentre: {type:ObjectId, ref:'workCentre', default:null}

    }, {collection: 'plantWorkGroup'});

    mongoose.model('plantWorkGroup', plantWorkGroupSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.plantWorkGroup = plantWorkGroupSchema;
})();
