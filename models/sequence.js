module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var sequenceSchema = mongoose.Schema({
        name               : {type: String,default: ''},
        sequencevalue      : {type: Number,default: 0},
    }, {collection: 'sequence'});

    mongoose.model('sequence', sequenceSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.sequence = sequenceSchema;
})();
    