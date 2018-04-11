module.exports = (function () {
    var mongoose = require('mongoose');

    var marketSettingsSchema = new mongoose.Schema({
        classId : Number,
        name    : {type: String, default: null},
        auto    : {type: Boolean, default: false}
    }, {collection: 'marketSettings'});

    mongoose.model('marketSettings', marketSettingsSchema);
    mongoose.Schemas.marketSettings = marketSettingsSchema;
})();
