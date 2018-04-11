module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var extend = require('mongoose-schema-extend');

    var baseSchema = mongoose.Schema({
       ID            : {type: String, defalut:''},
       trips         : {type: String}, 
       license       : {type: String},
       shipDate      : {type: Date},
       fee           : {type: Number},
       fee1          : {type: Number},
       deliverMan    : {type: String},
       receiver      : {type: String},
       salesman      : {type: String},
       status        : {type: String, defalut: 'New'},
       isReturn      : {type: Boolean, default: false},
       area          : {type: Number},
       price         : {type: Number},
       writeOffs     : {type: ObjectId, ref: 'writeOffs', default: null}
    }, {collection   : 'shippingNote', discriminatorKey: '_type'});


    var shippingNoteSchema = baseSchema.extend({
        goodsOutNote  : {type: ObjectId, ref:'goodsNote', default:null},
        barCodes      : {type: Array}
    });

    var oemOutNoteSchema = baseSchema.extend({
        oemNote       : {type: ObjectId, ref:'goodsNote', default:null},
        totalQuantity : Number,
        orderRows  : [{
            _id              : false,
            orderRowId       : {type: ObjectId, ref: 'orderRows', default: null},
            product          : {type: ObjectId, ref: 'Product', default: null},
            cost             : {type: Number, default: 0},
            unit             :{type: Number, default: 0},
            unitPrice        :{type: Number, default: 0},
            quantity         : {type: Number},
            returnNum        : {type: Number}
        }]
    });

    mongoose.model('shippingNote', shippingNoteSchema);
    mongoose.model('oemOutNote', oemOutNoteSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.shippingNote = shippingNoteSchema;
    mongoose.Schemas.oemOutNote = oemOutNoteSchema;


})();
