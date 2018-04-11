module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var bankbookSchema = mongoose.Schema({
        journal : {type: ObjectId, ref: 'journal', default: null, require: true},
        account : {type: ObjectId, ref: 'chartOfAccount', default: null},
        debit : {type: Number, default: 0},
        credit: {type: Number, default: 0},
        amount:{type:Number,default:0},
        bill:{type:String,default:'notCome'},
        restore:{type:String,default:'unRestore'},
        date:{type: Date, default: Date.now},
        type :{type:String,default:'normal'}


    }, {collection: 'Bankbook'});

    mongoose.model('Bankbook', bankbookSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.Bankbook = bankbookSchema;
})();
