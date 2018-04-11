module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var jobForemanSchema = mongoose.Schema({       
        name       : {type: String},        
        ID         : {type: String},            
        address: {                              
            province : {type: String, default: ''},  
            city     : {type: String, default: ''},
            district : {type: String, default: ''},
            zip      : {type: String, default: ''},
        },
        phone      : {type: String},           
        enterTime  : {type: Date},      
        estimate   : {type: String},            
        remark     : {type: String},        
        engineerInfo:{type: ObjectId, ref: 'engineerInfo', default: null}, 
        createdBy  : {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy   : {
            user:  {type: ObjectId, ref: 'Users', default: null},
            date:  {type: Date, default: Date.now}
        },
        isDelete   : {type: Boolean, default: false},
        status     : {type: String}
    }, {collection: 'jobForeman'});

    mongoose.model('jobForeman', jobForemanSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.jobForeman = jobForemanSchema;
})();
