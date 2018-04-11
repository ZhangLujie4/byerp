module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

  var scanlogSchema = mongoose.Schema({
      id: Number,
      barCode: {type: ObjectId, ref: 'barCode', default: null},
      workCentre: {type: ObjectId, ref: 'workCentre', default: null},
      workGroup: {type: ObjectId, ref: 'plantWorkGroup', default: null},
      scantime: {type: Date},
      uploadtime: {type: Date},
      status: {type: String, default: '0'},
      note: {type: String},
      price: {type: Number},
      area: {type: Number}
    }, {collection: 'scanlogs'});

    scanlogSchema.pre('save', function (next) {
        var scanlog = this;
        var db = scanlog.db.db;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'scanlog'
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }
            scanlog.id = rate.value.seq;

            next();
        });
    });

    mongoose.model('scanlog', scanlogSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.scanlog = scanlogSchema;
})();
