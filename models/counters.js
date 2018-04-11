module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var countersSchema = mongoose.Schema({
        name :  {type: String, default: ''},
        seq  :  {type: Number, default: 0},
        
    }, {collection: 'counters'});

    mongoose.model('counters', countersSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.Counter = countersSchema;
})();
