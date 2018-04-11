module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var taxSaveSchema = mongoose.Schema({

        invoice   :{type:String,default:null},
        tax       :{type:String,default:null},
        name     :{type:String,default:null},
        rate     :{type:Number,default:null},
        gist     :{type:Number,default:null},
        amount   :{type:Number,default:null},
        state:   {type:String,default:'normal'},

        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }


    }, {collection: 'taxSave'});

    mongoose.model('taxSave', taxSaveSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.taxSave = taxSaveSchema;
})();
