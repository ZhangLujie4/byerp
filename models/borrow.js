module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var borrowSchema = mongoose.Schema({
        pmr :{type: ObjectId, ref: 'Employees',default: null},
        project:{type: ObjectId, ref: 'Project', default: null},//先设置为project的外键，以后再改到opportunity。
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
        state:{type:String,default:'normal'}

    }, {collection: 'Borrow'});

    mongoose.model('Borrow', borrowSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.Borrow = borrowSchema;
})();
