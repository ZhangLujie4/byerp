module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var designRecSchema = mongoose.Schema({
        projectName  : {type: ObjectId, ref: 'building', default: null},
        orderNumber  : {type: String, default: ''},
        acreage      : {type: Number, default: 0},
        arrivalDate  : {type: Date, default: null},
        colorNumber  : {type: ObjectId, ref: 'colorNumber', default: null},
        protectType  : {type: String, default: ''},
        isMonitoring : {type: Boolean, default: false},
        follower     : {type: ObjectId, ref: 'Employees', default: null},
        uploadDate   : {type: Date, default: null},
        designer     : {type: ObjectId, ref: 'Employees', default: null},
        fileStatus   : {type: String, default: ''},
        attachments  : {type: Array, default: []},
        notes        : {type: Array, default: []},
        designDays   : {type: Number},
        orderStatus  : {type: String, default: ''},
        isReview     : {type: Boolean, default: false},
        isConfirm    : {type: Boolean, default: false},
        comment      : {type: String, default: ''},
        status       : {type: String, default: ''},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }
        
    }, {collection: 'designRec'});

    mongoose.model('designRec', designRecSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.DesignRec = designRecSchema;
})();
