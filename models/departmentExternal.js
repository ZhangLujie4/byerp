module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var departmentExternalSchema = mongoose.Schema({
        year           : {type: Number,default: 0},
        month          : {type: Number,default: 0},
        department     : {type: ObjectId, ref: 'Department', default: null},
        allowanceName  : {type: String,default: ''},
        amount         : {type: Number,default: 0}
    }, {collection: 'departmentExternal'});

    mongoose.model('departmentExternal', departmentExternalSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.departmentExternal = departmentExternalSchema;
})();
    