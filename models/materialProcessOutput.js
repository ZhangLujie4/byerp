module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var materialProcessOutputSchema = mongoose.Schema({
        area:{type:Number, default: 0},
        building:{type: ObjectId, ref: 'building', default: null},
        date:{type:Date,default:Date.now}

    }, {collection: 'materialProcessOutput'});

    mongoose.model('materialProcessOutput', materialProcessOutputSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.materialProcessOutput = materialProcessOutputSchema;
})();
