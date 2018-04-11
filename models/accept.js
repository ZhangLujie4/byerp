module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var acceptSchema = mongoose.Schema({
        acceptDate:{type: Date, default: Date.now},
        amount:{type:Number,default:null},
        acceptMan:{type:String,default:null},
        payDepartment:{type:String,default:null},
        Department:{type:String,default:null},
        endDate:{type: Date, default: Date.now},
        acceptNumber:{type:String,default:null},
        payBank:{type:String,default:null},
        receiveMan:{type:String,default:null},
        note:{type:String,default:null},
        payDate:{type: Date, default: null},
        acceptType:{type:String,default:null},
        acceptState:{type:String,default:null},
        editNote:{type:String,default:'normal'},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }


    }, {collection: 'Accept'});

    mongoose.model('Accept', acceptSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.Accept = acceptSchema;
})();
