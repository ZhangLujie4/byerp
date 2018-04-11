module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var enterpriseSchema = mongoose.Schema({
        fullName:{type:String,default:null},
        shortName:{type:String,default:null},
        taxFileNumber:{type:Number,default:null},
        spell:{type:String,default:null},
        region:{type:String,default:null},
        linkman:{type:String,default:null},
        phone:{type:Number,default:null},
        bank:{type:String,default:null},
        account:{type:Number,default:null},
        state  :{type:String,default:'normal'},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'enterprise'});

    mongoose.model('enterprise', enterpriseSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.enterprise = enterpriseSchema;
})();
