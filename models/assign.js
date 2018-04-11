module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var gendanOrdersSchema = mongoose.Schema({
        projectName  : {type: ObjectId, ref: 'Opportunities', default: null},
        orderNumber  : {type: String, default: ''},
        acreage      : {type: Number, default: 0},
        arrivalDate  : {type: Date, default: null},
        colorNumber  : {type: String, default: ''},
        colorCode    : {type: String, default: ''},
        protectType  : {type: String, default: ''},
        orderMaterial: {type: Boolean, default: false},
        gendanPerson : {type: ObjectId, ref: 'Employees', default: null},
        uploadDate   : {type: Date, default: null},
        designer     : {type: ObjectId, ref: 'Employees', default: null},
        fileStatus   : {type: String, default: ''},
        attachments  : {type: Array, default: []},
        notes        : {type: Array, default: []},
        designDays   : {type: Number, default: 0},
        comment      : {type: String, default: 'assign'}
        
    }, {collection: 'gendanOrders'});

    mongoose.model('gendanOrders', gendanOrdersSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.GendanOrder = gendanOrdersSchema;
})();
