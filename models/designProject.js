module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var DesignProjectSchema= mongoose.Schema({
        name                 : {type:String,default:null},
        projectName          : {type: ObjectId, ref: 'Opportunities', default: null},
        customer             : {type: ObjectId, ref: 'Customers', default: null},
        designDepartment     : {type: ObjectId, ref: 'Department', default: null},
        projectNumber        : {type:String,default:null},
        amount               : {type: String, default:0},
        signedDate           :  Date,
        archDate             :  Date,
        archiveMan           : {type: ObjectId, ref: 'Employees',default: null},
        note                 : {type:String,default:null},
        designContractType   : {type:String,default:null},
        attachments          : {type: Array, default: []},
        DesignBookNumber     : {type: ObjectId, ref: 'DesignBook', default: null},
        createdBy            : {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy            : {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date}
        },
        groups: {
            owner  : {type: ObjectId, ref: 'Users', default: null},
            users: [{type: ObjectId, ref: 'Users', default: null}],
            group: [{type: ObjectId, ref: 'Department', default: null}]
        },
        whoCanRW        : {type: String, enum: ['owner', 'group', 'everyOne'], default: 'everyOne'}
    },{collection: 'DesignProject'});

    mongoose.model('DesignProject', DesignProjectSchema);


    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }
    mongoose.Schemas.DesignProject = DesignProjectSchema;

})();
