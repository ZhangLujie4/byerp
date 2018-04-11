module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var safetyManClassifySchema = mongoose.Schema({
        name: {type: String},
    }, {collection: 'safetyManClassify'});

    mongoose.model('safetyManClassify', safetyManClassifySchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.safetyManClassify = safetyManClassifySchema;
})();

