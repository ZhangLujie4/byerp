module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var DesignBookSchema= mongoose.Schema({
        name                 : {type:String,default:null},
        projectName          : {type: ObjectId, ref: 'Opportunities', default: null},
        projectNumber        : {type:String,default:null},
        customer             : {type: ObjectId, ref: 'Customers', default: null},
        designDepartment     : {type: ObjectId, ref: 'Department', default: null},
        designLeader         : {type: ObjectId, ref: 'Employees',default: null},
        amount               : {type: String, default:0},
        designDate           : {type:Date,default:Date.now},
        designContractType   : {type:String,default:null},
        accountReceivable    : {type: Number, default:0},
        accountReceived      : {type: Number, default:0},
        invoiceAccountReceivable:{type: Number, default:0},
        expenseDepartment    : {type:String,default:null},
        otherDepartment      : {type:String,default:null},
        designRequire        : {
            effectPicture      : [{type:String,default:null}],
            conceptualPicture  : {type:String,default:null},
            constructPicture   : {type:String,default:null},
            pushDate           :  Date,
            pushRequire        : {type:String,default:null}
        },
        designType          :{
            requireType       : [{type:String,default:null}],
            otherType         : {type:String,default:null},
            texture           : {type:String,default:null},
            structure         : {type:String,default:null},
            otherStructure    : {type:String,default:null}
        },
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
    },{collection: 'DesignBook'});

    mongoose.model('DesignBook', DesignBookSchema);


    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }
    mongoose.Schemas.DesignBook = DesignBookSchema;

})();
