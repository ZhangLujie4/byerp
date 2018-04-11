module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var projectInvoiceSchema = mongoose.Schema({
        project         :{type: ObjectId, ref: 'Project', default: null},
        invoice         :{type: ObjectId, ref: 'Invoice', default: null},
        invoiceTax      :{type:Number,default:0},
        rate            :{type:Number,default:0},
        sell            :{type:Number,default:0},
        addValueTax     :{type:Number,default:0},
        sellTax         :{type:Number,default:0},
        note            :{type:String,default:null},
        state           :{type:String,default:'normal'},
        examine         :{type:String,default:'unExamine'},
        profit          :{type:String,default:0},
        invoiceGist     :{type:Number,default:0},
        sellGist        :{type:Number,default:0},
        payer           :{type: ObjectId, ref: 'enterprise', default: null},
        name            :{type:String,default:null},
        amount          :{type:Number,default:0},
        cost            :{type:Number,default:0},
        day             :{type:Date,default:Date.now},
        type            :{type:String,default:null},
        dataType        :{type:String,default:'project'},
        receive         :{type:Number,default:0},
        makeSell        :{type:String,default:'no'},
        createdBy  : {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }


    }, {collection: 'projectInvoice'});

    mongoose.model('projectInvoice', projectInvoiceSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.projectInvoice = projectInvoiceSchema;
})();

