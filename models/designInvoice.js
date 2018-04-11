module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var designInvoiceSchema = mongoose.Schema({
        department:{type:ObjectId,ref:'Department',default:null},
        project:{type:ObjectId,ref:'DesignProject',default:null},
        invoiceDate:{type: Date, default: Date.now},
        amount:{type:Number,default:null},
        payer:{type:ObjectId,ref:'enterprise',default:null},
        realPayer :{type:ObjectId,ref:'enterprise',default:null},
        type:{type:String,default:null},
        name:{type:String,default:null},
        note:{type:String,default:null},
        receive:{type:Number,default:null},
        state  :{type:String,default:'normal'},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'designInvoice'});

    mongoose.model('designInvoice', designInvoiceSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.designInvoice = designInvoiceSchema;
})();
