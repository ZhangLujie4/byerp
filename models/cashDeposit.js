module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var cashDepositSchema = mongoose.Schema({

        department        :{type: ObjectId, ref: 'Department', default: null},
        project           :{type: ObjectId, ref: 'Project', default: null},
        type              :{type:String,default:null},
        description       :{type:String,default:null},
        endDate           :{type:Date,default:null},
        companyProject    :{type:String,default:null},
        applyDate         :{type:Date,default:null},
        amount            :{type:Number,default:null},
        openDate          :{type:Date,default:null},
        payDate           :{type:Date,default:null},
        paymentMethod     :{type:String,default:null},
        pmrAmount         :{type:Number,default:null},
        cash              :{type:Number,default:0},
        projectAmount     :{type:Number,default:0},
        unPay             :{type:Number,default:0},
        loanAgreement     :{type:Number,default:null},
        state             :{type:String,default:'normal'},
        flow              :{type:String,default:'apply'},
        number            :{type:String,default:null},
        note              :{type:String,default:null},
        pmr               :{type: ObjectId, ref: 'Employees',default: null},
        depositType       :{type:String,default:null},
        enterprise        :{type:ObjectId,ref:'enterprise',default:null},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }

    }, {collection: 'cashDeposit'});

    function setName(next) {
        var cashDeposit = this;
        var db = cashDeposit.db.db;
        var number = cashDeposit.number;
        var date = new Date();
        var inDate = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            number  : number,
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

            cashDeposit.number = number + inDate + '*' + rate.value.seq;

            next();
        });
    }
    cashDepositSchema.pre('save',setName);

    mongoose.model('cashDeposit', cashDepositSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.cashDeposit = cashDepositSchema;
})();
