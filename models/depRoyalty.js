/**
 * Created by wmt on 2017/7/25.
 */
module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var depRoyaltySchema = mongoose.Schema({
        person      : {type: ObjectId, ref: 'Employees', default: null},
        year        : Number,
        guaSalary   : Number,
        basePay     : Number,
        ratedAtten  : Number,
        effecAtten  : Number,
        paidWages   : Number,
        commission  : Number,
        wBonuses    : Number, 
        description : {type: String, default: ''}
    }, {collection: 'DepRoyalty'});

    mongoose.model('DepRoyalty', depRoyaltySchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.DepRoyalty = depRoyaltySchema;
})();
