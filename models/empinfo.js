module.exports = (function () {
    var mongoose = require('mongoose');
	var ObjectId = mongoose.Schema.Types.ObjectId;
    var empInfoSchema = mongoose.Schema({
        employee: {type: ObjectId, ref: 'Employees', default: null},
        department: {type: ObjectId, ref: 'Department', default: null},
        identNo: {type:String},
        attenNo: {type:Number},
        type: {type: String},
        effecDate: {type: Date}
    }, {collection: 'empInfo'});

    mongoose.model('empInfo', empInfoSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.empInfo = empInfoSchema;
})();
