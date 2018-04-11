module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var taxCategoriesSchema = mongoose.Schema({

        name     :{type:String,default:null},
        sequence :{type:Number,default:null},
        rate     :{type:Number,default:null},
        gist     :{type:ObjectId, ref: 'taxCategories', default: null},
        type     :{type:String,default:'oneself'},
        state    :{type:String,default:'normal'},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }


    }, {collection: 'taxCategories'});

    mongoose.model('taxCategories', taxCategoriesSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.taxCategories = taxCategoriesSchema;
})();
