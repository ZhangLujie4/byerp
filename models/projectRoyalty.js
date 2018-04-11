module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var person={
        name:{type: String,default: null},
        type:{type:String,default:null},
        rate:{type:Number,default:null},
        basic:{type:Number,default:0},
        bonus:{type:Number,default:0}
    };

    var royalty={
        name:{type:String,default:null},
        basic:{type:Number,default:0}
    };
    var detail={
        payment:{
            paidAmount:{type:Number,default:null},
            date: {type: Date, default: Date.now}
        },
        details:[royalty]
    };

    var outNotes={
        goodsNote:{type:ObjectId,ref:'GoodsOutNote',default:null},
        paidAmount:{type:Number,default:0},
        confirmAmount:{type:Number,default:0},
        confirmArea:{type:Number,default:0},
        confirmDate:{type:Date,default:null},
        dueDate:{type:Date,default:null},
        flag:{type:Number,default:'0'}
    };

    var mergeNotes={
        note:[{type:ObjectId,ref:'GoodsOutNote',default:null}],
        dueDate:{type:Date,default:null}
    };


    var projectRoyaltySchema = mongoose.Schema({

        buildingProject:{type:ObjectId,ref:'buildingContract',default:null},
        persons:[person],
        royalties:[detail],
        allNote:[outNotes],
        mergeNote:[mergeNotes],
        advance:{type:Number,default:0},
        graceDay:{type:Number,default:'15'},
        yearDueDate:[{type:Date,default:null}],
        finishDueDate:{type:Date,default:null},
        state  :{type:String,default:'normal'},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'projectRoyalty'});

    mongoose.model('projectRoyalty', projectRoyaltySchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.projectRoyalty = projectRoyaltySchema;
})();
