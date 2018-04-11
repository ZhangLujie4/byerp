module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var extend = require('mongoose-schema-extend');

    var inventory = {
        _id             : false,
        id              : false,
        finishDate      :{type: String, default: null},
        items           :{type: String, default: ''},
        subitems        :{type: String, default: ''},
        unit            :{type: String, default: ''},
        amount          :{type: Number, default: 0},
        price           :{type: Number, default: 0},
        money           :{type: Number, default: 0},
        notes            :{type: String, default: ''}
    };

    var products = {
        _id             : false,
        id              : false,
        product         :{type: ObjectId, ref: 'Product', default: null},
        subTotal        :{type: Number, default: 0},
        unitPrice       :{type: Number, default: 1},
        processingCharges:{type: Number, default: 0},
        quantity        :{type: Number, default: 1},
        qty1            :{type:String,default:null},
        price1          :{type:Number,default:0},
        qty2            :{type:String,default:null},
        price2          :{type:Number,default:0},
        qty3            :{type:String,default:null},
        price3          :{type:Number,default:0},
        qty4            :{type:String,default:null},
        price4          :{type:Number,default:0},
        qty5            :{type:String,default:null},
        price5          :{type:Number,default:0},
        sourceAl        :{type: ObjectId, ref: 'marketSettings', default: null}

    };

    var contractSchema = new mongoose.Schema({

        project     : {type: ObjectId, ref: 'Project', default: null},
        number      : {type: String, default:null},
        description : {type: String, default:null},
        signedDate  : {type: Date, default: Date.now},
        taskAmount  : {type: Number, default:null},
        attachments : {type: Array, default: []},
        note        : {type: String, default: null},
        count       : {type:Number,default:0},
        workflow   : {type: ObjectId, ref: 'workflows', default: null},
        whoCanRW    : {type: String, enum: ['owner', 'group', 'everyOne'], default: 'everyOne'},

        groups: {
            owner: {type: ObjectId, ref: 'Users', default: null},
            users: [{type: ObjectId, ref: 'Users', default: null}],
            group: [{type: ObjectId, ref: 'Department', default: null}]
        },
        createdBy     : {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        }

    }, {collection: 'contract', discriminatorKey: '_type'});

    var internalContractSchema = contractSchema.extend({
        deductedTax : {type:Number,default:0},
        adminFee    : {type:Number,default:0},
        depositCash : {type:Number,default:0}
    });

    var labourContractSchema = contractSchema.extend({
        assignedTo  : {type: ObjectId, ref: 'Employees', default: null},
        payTerm     :{type: String, default: null},
        violation   : {type: String, default: null},
        quality     :{type: String, default: null},
        inventory   :[inventory]
    });

    var outContractSchema = contractSchema.extend({
        payProp     :{type: String, default: null},
        supplier    :{type: ObjectId, ref: 'Customers', default: null},
        sealType    :{type: String, default: null},
        payTerm     :{type: String, default: null},
        preAmount   :{type: Number, default: 0},
        preAmountType:{type: String, default:''},
        paymentType :{type: String, default: null},
        payType     :{type: String, default: null},
        carriage    :{type: String, default: null},
        quota       :{type: String, default: null},
        proDate     :{type: Date, default: Date.now},
        respons    :{type: String, default: null},
        violation   : {type: String, default: null},
        quality     :{type: String, default: null}
    });

    var machineContractSchema = contractSchema.extend({
        leaseOwner  :{type: String, default: null},
        unit        :{type: Number, default: 0},
        payTerm     :{type: String, default: null},
        preAmount   :{type: Number, default: 0},
        violation   : {type: String, default: null},
        quality     :{type: String, default: null}

    });

    var purchaseContractSchema = contractSchema.extend({
        payProp     :{type: String, default: null},
        supplier    :{type: ObjectId, ref: 'Customers', default: null},
        sealType    :{type: String, default: null},
        payTerm     :{type: String, default: null},
        preAmount   :{type: Number, default: 0},
        preAmountType:{
            payType:{type:String,default:null},
            number:{type:Number,default:null},
            mold:{type:String,default:null}
        },
        paymentType :{
            mold:{type:String,default:null},
            monthNumber:{type:Number,default:null},
            nodeType:{type:String,default:null},
            number1:{type:String,default:null},
            number2:{type:String,default:null}
        },
        payType     : [{
            mold:{type:String,default:null},
            number:{type:String,default:null}
           }]
        ,
        carriage    :{
            mold:{type:String,default:null},
            byAmount:[{
                number1:{type:Number,default:null},
                number2:{type:Number,default:null},
                number3:{type:Number,default:null}
            }],
            byAddress:[{
            addressType:{type:String,default:null},
            addressTypes:{type:String,default:null},
            addressNumber:{type:Number,default:null}}
            ]
        },
        quota       :{
            choose:{type:String,default:0},
            number1:{type:String,default:null},
            number2:{type:String,default:null},
            number3:{type:String,default:null}
        },
        proDate     :{type: String, default: null},
        proProduct     :{type: String, default: null},
        respons     :{type: String, default: null},
        violation   : {type: String, default: null},
        quality     :{type: String, default: null},
        products   :[products]
    });



    function setNameInternalContract(next) {
        var order = this;
        var db = order.db.db;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'internalContract',
            order : order.name
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            order.name += '*' + rate.value.seq;

            next();
        });
    }

    function setNameLabourContract(next) {
        var order = this;
        var db = order.db.db;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'labourContract',
            order : order.name
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            order.name += '*' + rate.value.seq;

            next();
        });
    }

    function setNameOutContract(next) {
        var order = this;
        var db = order.db.db;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'outContract',
            order : order.name
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            order.name += '*' + rate.value.seq;

            next();
        });
    }

    function setNameMachineContract(next) {
        var order = this;
        var db = order.db.db;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'machineContract',
            order : order.name
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            order.name += '*' + rate.value.seq;

            next();
        });
    }

    function setNamePurchaseContract(next) {
        var order = this;
        var db = order.db.db;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'purchaseContract',
            order : order.name
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            order.name += '*' + rate.value.seq;

            next();
        });
    }



    internalContractSchema.pre('save',setNameInternalContract);
    labourContractSchema.pre('save', setNameLabourContract);
    outContractSchema.pre('save',setNameOutContract);
    machineContractSchema.pre('save',setNameMachineContract);
    purchaseContractSchema.pre('save',setNamePurchaseContract);


    mongoose.model('internalContract', internalContractSchema);
    mongoose.model('labourContract', labourContractSchema);
    mongoose.model('outContract', outContractSchema);
    mongoose.model('machineContract', machineContractSchema);
    mongoose.model('purchaseContract', purchaseContractSchema);


    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }
    mongoose.Schemas.internalContract = internalContractSchema;
    mongoose.Schemas.labourContract = labourContractSchema;
    mongoose.Schemas.outContract = outContractSchema;
    mongoose.Schemas.machineContract = machineContractSchema;
    mongoose.Schemas.purchaseContract = purchaseContractSchema;

})();
