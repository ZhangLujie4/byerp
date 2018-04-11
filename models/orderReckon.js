module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var orderReckonsSchema = mongoose.Schema({
        projectName      : {type: ObjectId, ref: 'Opportunities', default: null},
        workNumber       : {type: String, default: ''},
        processContent   : {type: String, default: ''},
        price            : {type: Number, default: 0},
        reckonDate       : {type: Date, default: Date.now},
        employeeName     : {type: ObjectId, ref: 'Employees', default: null},
        employeeQuantity : {type: Number, default: 0}
        
    }, {collection: 'orderReckons'});

    mongoose.model('orderReckons', orderReckonsSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.OrderReckon = orderReckonsSchema;
})();
