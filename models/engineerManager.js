module.exports = (function () {
    var mongoose = require('mongoose');
	var ObjectId = mongoose.Schema.Types.ObjectId;
    var engineerManagerSchema = mongoose.Schema({       
        name       : {type: String},        
        jobPosition: {type: String},  
        enterTime  : {type: Date},      
        age        : {type: Number},        
        jobType    : {type: String},   
        jobQua     : {type: String},        
        certificate: {type: String},        
        phone      : {type: String},        
        remark     : {type: String},     
        engineerInfo:{type: ObjectId, ref: 'engineerInfo', default: null},
        createdBy  : {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy   :{
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        status     : {type: String},
        isDelete   : {type: Boolean, default: false}
    }, {collection: 'engineerManager'});

    mongoose.model('engineerManager', engineerManagerSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.engineerManager = engineerManagerSchema;
})();
