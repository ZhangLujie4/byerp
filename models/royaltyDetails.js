/**
 * Created by wmt on 2017/7/25.
 */
module.exports = (function () {
    var mongoose = require('mongoose');
	var ObjectId = mongoose.Schema.Types.ObjectId;
	
    var royaltyDetailsSchema = new mongoose.Schema({
        project : {type: ObjectId, ref: 'Opportunities', default: null},
        comRate : {type: Number, default: 0},
        persons : {type: Array, default: []}
    }, {collection: 'royaltyDetails'});

    mongoose.model('royaltyDetails', royaltyDetailsSchema);
    mongoose.Schemas.royaltyDetails = royaltyDetailsSchema;
})();
