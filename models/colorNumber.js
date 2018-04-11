module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var colorNumberSchema = mongoose.Schema({
        projectId    : {type: ObjectId, ref: 'building', default: null},
        colorNumber  : {type: String, default: ''},
        colorCode    : {type: String, default: ''},
        status       : {type: String, default: ''},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }
        
    }, {collection: 'colorNumber'});

    mongoose.model('colorNumber', colorNumberSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.ColorNumber = colorNumberSchema;
})();
