module.exports = (function() {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var goodsAllocateSchema = new mongoose.Schema({
        date: { type: Date, default: Date.now },
        user: { type: ObjectId, ref: 'Users', default: null },
        reason: { type: String, default: '' },
        order: { type: ObjectId, ref: 'Order', default: null },
        name: String,
        orderRows: [{
            orderRowId: { type: ObjectId, ref: 'orderRows', default: null },
            quantity: Number,
            parameters: { type: Array, default: [] }
        }]
    }, { collection: 'goodsAllocate' });

    function setName(next) {
        var order = this;
        var db = order.db.db;
        var date = new Date();
        var datestr = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;
        var reason = order.reason || 'FP';

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'goodsOutNote',
            //order : order.name
        date  : datestr
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            order.name = reason + datestr + '*' + rate.value.seq;

            next();
        });
    }
    goodsAllocateSchema.pre('save',setName);
    mongoose.model('goodsAllocate', goodsAllocateSchema);
    mongoose.Schemas.goodsAllocate = goodsAllocateSchema;

})()