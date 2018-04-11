module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var extend = require('mongoose-schema-extend');

    var goodsNoteSchema = new mongoose.Schema({
        warehouse: {type: ObjectId, ref: 'warehouse', default: null},

        reference     : {type: String, default: ''},
        boxes         : {type: Number, default: 1},
        shippingMethod: {type: ObjectId, ref: 'shippingMethod', default: null},
        shippingCost  : {type: Number, default: 0},
        weight        : {type: Number, default: 1.00},
        releaseDate   : Date,
        date          : {type: Date, default: Date.now},
        createdBy     : {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },

        description: {type: String, default: ''},

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },

        order: {type: ObjectId, ref: 'Order', default: null},

        attachments: {type: Array, default: []},

        orderRows  : [{
            _id             : false,
            orderRowId      : {type: ObjectId, ref: 'orderRows', default: null},
            product         : {type: ObjectId, ref: 'Product', default: null},
            locationsDeliver: [{type: ObjectId, ref: 'location', default: null}],
            cost            : {type: Number, default: 0},
            quantity        : Number,
            parameters      : {type: Array, default: []}
        }],

        channel      : {type: ObjectId, ref: 'integrations', default: null},
        integrationId: String,
        sequence     : Number,
        name         : String,
        isValid      : {type:Boolean, default:false},
        reason       : String
    }, {collection: 'GoodsNote', discriminatorKey: '_type'});

    var goodsOutNoteSchema = goodsNoteSchema.extend({
        status: {
            shipped    : Boolean,
            picked     : Boolean,
            packed     : Boolean,
            printed    : Boolean,
            shippedOn  : Date,
            pickedOn   : Date,
            packedOn   : Date,
            printedOn  : Date,
            pickedById : {type: ObjectId, ref: 'Users', default: null},
            packedById : {type: ObjectId, ref: 'Users', default: null},
            shippedById: {type: ObjectId, ref: 'Users', default: null},
            printedById: {type: ObjectId, ref: 'Users', default: null},
            approved   : Boolean,
            approvedOn : Date,
            approvedById: {type: ObjectId, ref: 'Users', default: null}
        },
        orderRows  : [{
            _id             : false,
            orderRowId      : {type: ObjectId, ref: 'orderRows', default: null},
            product         : {type: ObjectId, ref: 'Product', default: null},
            barCodes        : {type: Array, default: []},
            gnotesDeliver: [{
                location: {type: ObjectId, ref: 'location', default: null},
                goodsInNoteId: {type: ObjectId, ref: 'GoodsInNote', default: null},
                goodsInorderRowId   : {type: ObjectId, ref: 'orderRows', default: null},
                quantity: Number
            }],
            cost            : {type: Number, default: 0},
            quantity        : Number
        }],
        
        archived: {type: Boolean, defaul: false},
        load: {type: String, default: ''},
        unLoad: {type: String, default: ''}
    });

    var goodsInNoteSchema = goodsNoteSchema.extend({
        status: {
            received    : Boolean,
            receivedOn  : Date,
            receivedById: {type: ObjectId, ref: 'Users', default: null},
            approved: Boolean,
            approvedOn: Date,
            approvedById: {type: ObjectId, ref: 'Users', default: null}
        },

        shippinglist : {type: String, default: ''},

        orderRows: [{
            _id              : false,
            orderRowId       : {type: ObjectId, ref: 'orderRows', default: null},
            product          : {type: ObjectId, ref: 'Product', default: null},
            cost             : {type: Number, default: 0},
            locationsReceived: [{
                location: {type: ObjectId, ref: 'location', default: null},
                quantity: Number
            }],
            parameters       :{type: Array, default: []},
            unit             :{type: Number, default: 0},
            unitPrice        :{type: Number, default: 0},
            UOM              :{type: String, default: ''},
            UOP              : {type: String, default: null},
            quantity         : Number,
            taxCode: {type: ObjectId, ref: 'taxes', default: null},
            tax: {type: Number}
        }],
        invoiceName: {type: String, default: null}
    });

    var stockCorrectionSchema = goodsInNoteSchema.extend({
        building: {type: ObjectId, ref: 'building', default: null}
    });

    var stockReturnSchema = goodsInNoteSchema.extend({
        status: {
            received    : Boolean,
            receivedOn  : Date,
            receivedById: {type: ObjectId, ref: 'Users', default: null}
        },

        description: String,

        journalEntrySources: [{type: String, default: ''}],

        orderRows: [{
            _id         : false,
            goodsOutNote: {type: ObjectId, ref: 'GoodsOutNote', default: null},
            goodsInNote : {type: ObjectId, ref: 'GoodsInNote', default: null},
            product     : {type: ObjectId, ref: 'Product', default: null},
            cost        : {type: Number, default: 0},
            quantity    : Number,
            warehouse   : {type: ObjectId, ref: 'warehouse', default: null}
        }]
    });

    var stockTransactionsSchema = goodsInNoteSchema.extend({
        warehouseTo: {type: ObjectId, ref: 'warehouse', default: null},
        status     : {
            shipped     : Boolean,
            received    : Boolean,
            packed      : Boolean,
            printed     : Boolean,
            shippedOn   : Date,
            receivedOn  : Date,
            packedOn    : Date,
            printedOn   : Date,
            receivedById: {type: ObjectId, ref: 'Users', default: null},
            packedById  : {type: ObjectId, ref: 'Users', default: null},
            shippedById : {type: ObjectId, ref: 'Users', default: null},
            printedById : {type: ObjectId, ref: 'Users', default: null}
        },

        orderRows: [{
            orderRowId      : {type: ObjectId, ref: 'orderRows', default: null},
            product         : {type: ObjectId, ref: 'Product', default: null},
            locationsDeliver: [{type: ObjectId, ref: 'location', default: null}],
            batchesDeliver  : [{
                goodsNote: {type: ObjectId, ref: 'GoodsInNote', default: null},
                quantity : Number,
                cost     : Number
            }],

            locationsReceived: [{
                location: {type: ObjectId, ref: 'location', default: null},
                quantity: Number
            }],

            cost    : {type: Number, default: 0},
            parameters: {type: Array, default: []},
            quantity: Number
        }]

    });

    var oemNoteSchema = goodsInNoteSchema.extend({
        building: {type: ObjectId, ref: 'building', default: null},
        load: String,
        unLoad: String,
        orderRows: [{
            _id              : false,
            orderRowId       : {type: ObjectId, ref: 'orderRows', default: null},
            product          : {type: ObjectId, ref: 'Product', default: null},
            cost             : {type: Number, default: 0},
            locationsReceived: [{
                location: {type: ObjectId, ref: 'location', default: null},
                quantity: Number
            }],
            unit             :{type: Number, default: 0},
            unitPrice        :{type: Number, default: 0},
            quantity         : Number,
            Planqty          : Number
        }]
    });

    function setName(next) {
        var order = this;
        var db = order.db.db;
        var date = new Date();
	var datestr = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;
	var reason = order.reason || 'CK';

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

    function setNameTransfer(next) {
        var transaction = this;
        var db = transaction.db.db;
        var prefix = 'TX';

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : prefix
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            transaction.name = prefix + '-' + rate.value.seq;

            next();
        });
    }

    function setNameReturns(next) {
        var transaction = this;
        var db = transaction.db.db;
        var prefix = 'RT';

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : prefix
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            transaction.name = prefix + '-' + rate.value.seq;

            next();
        });
    }

    function setNamePurchase(next) {
        var order = this;
        var db = order.db.db;
	var reason = order.reason || 'RK';
	var date = new Date();
	var datestr = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'goodsInNote',
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

    function setNameIn(next) {
        var order = this;
        var db = order.db.db;
        var reason = order.reason;
        var date = new Date();
        var inDate = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : reason,
            inDate: inDate
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            order.name = reason + inDate + '*' + rate.value.seq;

            next();
        });
    }

    goodsOutNoteSchema.pre('save',setName);
    stockTransactionsSchema.pre('save', setNameTransfer);
    goodsInNoteSchema.pre('save', setNamePurchase);
    oemNoteSchema.pre('save', setNameIn);

    stockReturnSchema.pre('save', setNameReturns);

    mongoose.model('GoodsOutNote', goodsOutNoteSchema);
    mongoose.model('GoodsInNote', goodsInNoteSchema);
    mongoose.model('stockCorrections', stockCorrectionSchema);
    mongoose.model('stockTransactions', stockTransactionsSchema);
    mongoose.model('stockReturns', stockReturnSchema);
    mongoose.model('oemNote', oemNoteSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.GoodsOutNote = goodsOutNoteSchema;
    mongoose.Schemas.GoodsInNote = goodsInNoteSchema;
    mongoose.Schemas.stockCorrection = stockCorrectionSchema;
    mongoose.Schemas.stockTransactions = stockTransactionsSchema;
    mongoose.Schemas.stockReturns = stockReturnSchema;
    mongoose.Schemas.oemNote = oemNoteSchema;	 
})();
