module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var inventory = {
        _id          : false,
        id           : false,
        product      : {type: ObjectId, ref: 'Product', default: null},
        quantity     : {type: Number, default: 0},
        price        : {type: Number, default: 0},
        unit         : {type: String, default: ''},
        totalPrice   : {type: Number, default: 0},
        alumSource   : {type: String, default: ''},
        alumRange1   : {type: Number, default: 0},
        alumRange2   : {type: Number, default: 0},
        alumPrice    : {type: Number, default: 0},
        executePrice : {type: Number, default: 0}
    };

    var aluminum = {
        _id          : false,
        id           : false,
        items        : {type: String, default: ''},
        price        : {type: Number, default: 0},
        unit         : {type: String, default: ''},
        notes        : {type: String, default: ''}
    };

    var buildingContractSchema = mongoose.Schema({
        projectName   : {type: ObjectId, ref: 'building', default: null},
        //projectName   : {type: String, default: ''},
        customer      : {type: ObjectId, ref: 'Customers', default: null},
        contactName   : {type: String, default: ''},
        customerPhone : {type: String, default: ''},
        orderDate     : {type: Date},
        projectManager: {type: String, default: ''},
        managerPhone  : {type: String, default: ''},
        shipAddress   : {type: String, default: ''},
        deliveryDate1 : {type: Date},
        deliveryDate2 : {type: Date},
        clerk1        : {type: String, default: ''},
        clerk2        : {type: String, default: ''},
        clerk3        : {type: String, default: ''},
        merchandiser1 : {type: String, default: ''},
        merchandiser2 : {type: String, default: ''},
        merchandiser3 : {type: String, default: ''},
        inUndertaking : {type: Boolean, default: false},
        contractNum   : {type: String, default: ''},
        clerkRate     : {type: Number, default: 0},
        clerkRate1    : {type: Number, default: 0},
        clerkRate2    : {type: Number, default: 0},
        clerkRate3    : {type: Number, default: 0},
        merchandiserRate  : {type: Number, default: 0},
        merchandiserRate1 : {type: Number, default: 0},
        merchandiserRate2 : {type: Number, default: 0},
        merchandiserRate3 : {type: Number, default: 0},
        consignee     : {type: String, default: ''},
        consigneePhone: {type: String, default: ''},
        expectDate    : {type: Date},
        projectCost   : {type: Number, default: 0},
        projectQuantity : {type: Number, default: 0},
        addProvision  : {type: String, default: ''},
        payRate1      : {type: Number, default: 0},
        payRate2      : {type: Number, default: 0},
        payRate3      : {type: Number, default: 0},
        payRate4      : {type: Number, default: 0},
        payRate5      : {type: Number, default: 0},
        payRate6      : {type: Number, default: 0},
        payRate7      : {type: Number, default: 0},
        earnest       : {type: Number, default: 0},
        areaSettle    : {type: Number, default: 0},
        amountSettle  : {type: Number, default: 0},
        aroundType    : {type: String, default: ''},
        time          : {type: Number, default: 0},
        unitType      : {type: String, default: ''},
        warrantyDate  : {type: Number, default: 0},
        inventory     : [inventory],
        aluminum      : [aluminum],
        minArea       : {type: Number},
        status        : {type: String, default: ''},
        attachments   : {type: Array, default: []},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }
        
    }, {collection: 'buildingContract'});

    mongoose.model('buildingContract', buildingContractSchema);

    function setName(next) {
        var buildingContract = this;
        var db = buildingContract.db.db;
        var date = new Date();
        var inDate = date.getFullYear()*10000+date.getMonth()*100+date.getDate()+100;

        db.collection('settings').findOneAndUpdate({
            dbName: db.databaseName,
            name  : 'buildingContract',
            inDate: inDate
        }, {
            $inc: {seq: 1}
        }, {
            returnOriginal: false,
            upsert        : true
        }, function (err, rate) {
            if (err) {
                return next(err);
            }

            buildingContract.contractNum = inDate + '*' + rate.value.seq;

            next();
        });
    }

    buildingContractSchema.pre('save', setName);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.BuildingContract = buildingContractSchema;
})();
