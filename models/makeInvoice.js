module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var makeInvoiceSchema = mongoose.Schema({
        pmv :{type: ObjectId, ref: 'Employees',default: null},
        project:{type: ObjectId, ref: 'Project', default: null},
        addValueInvoice:{type:ObjectId,ref:'addValueTaxInvoice',default:null},
        amount:{type:Number,default:null},
        day:{type: Date, default: Date.now},
        targetDate:{type: Date, default:null},
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        examine:{type:String,default:null},//审批
        interest:{type:Number,default:0},
        rate1:{type:Number,default:null},
        rate2:{type:Number,default:null},
        rate3:{type:Number,default:null},
        state:{type:String,default:null}

    }, {collection: 'MakeInvoice'});

    mongoose.model('MakeInvoice', makeInvoiceSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.MakeInvoice = makeInvoiceSchema;
})();
