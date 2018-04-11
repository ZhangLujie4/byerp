module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var dailyReportSchema = mongoose.Schema({
        userId: {type: ObjectId, ref: 'Users', default: null},
        content: {type: String, default: ''},
        dateStr: {type: String, default: ''},//date: {type: Date, default: Date.now}
        status: {type: String, default: 'new'},
        review: {type: String, default: ''},
        whoCanRW: {type: String, enum: ['owner', 'group', 'everyOne'], default: 'everyOne'},
        groups: {
            owner: {type: ObjectId, ref: 'Users', default: null},
            users: [{type: ObjectId, ref: 'Users', default: null}],
            group: [{type: ObjectId, ref: 'Department', default: null}]
        }
    }, {collection: 'dailyReport'});

    mongoose.model('dailyReport', dailyReportSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.dailyReport = dailyReportSchema;
})();