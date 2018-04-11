module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var FECertificateSchema = mongoose.Schema({
        makeDate:{type: Date, default: Date.now},//开出日期
        endDate:{type: Date, default: null},//到期日期
        pmr         :{type: ObjectId, ref: 'Employees',default: null},//项目经理
        project:{type: ObjectId, ref: 'Project', default: null},//先设置为project的外键，以后再改到opportunity。
        amount:{type:Number,default:null},//金额
        number:{type:String,default:null},//号码
        logoutDate:{type: Date, default: Date.now},//注销日期
        editNote:{type:String,default:null},//编辑，修改备注
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'FECertificate'});

    mongoose.model('FECertificate', FECertificateSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.FECertificate = FECertificateSchema;
})();
