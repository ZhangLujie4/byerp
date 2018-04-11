module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var person={
        name:{type: ObjectId, ref: 'Employees', default: null},
        rate:{type:Number,default:null}
    };
    var royalty={
        personId:{type: ObjectId, ref: 'Employees', default: null},
        name:{type:String,default:null},
        amount:{type:Number,default:null}
    };
    var detail={
        date: {type: Date, default: Date.now},
        amount:{type:Number,default:null},
        details:[royalty]
    };
    var designRoyaltySchema = mongoose.Schema({
        project:{type:ObjectId,ref:'DesignProject',default:null},
        amount:{type:Number,default:null},
        receive:{type:Number,default:0},
        balance:{type:Number,default:null},
        persons:[person],
        royalties:[detail],
        state  :{type:String,default:'normal'},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'designRoyalty'});

    mongoose.model('designRoyalty', designRoyaltySchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.designRoyalty = designRoyaltySchema;
})();
