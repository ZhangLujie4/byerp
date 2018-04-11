module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var bankSchema = mongoose.Schema({
        name:{type:String,default:null},
        account:{type:Number,default:null},
        address:{type:String,default:null},
        telephone:{type:Number,default:null},
        linkman:{type:String,default:null},
        bankAccount : {type: ObjectId, ref: 'chartOfAccount', default: null},//bank id in chartOfAccount
        debit:{type:Number,default:0},
        credit:{type:Number,default:0},
        incomeNumber:{type:Number,default:0},
        expendNumber:{type:Number,default:0},
        editNote:{type:String,default:null},//编辑，修改备注
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'Bank'});

    mongoose.model('Bank', bankSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.Bank = bankSchema;
})();
