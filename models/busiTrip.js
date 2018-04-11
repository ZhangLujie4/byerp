module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var busiTripSchema = mongoose.Schema({
        ID       : {type: Number,default: 0},
        name     : {type: ObjectId, ref: 'Employees', default: null},
        registrationDate: Date,
        date     : {
            from: Date,
            to: Date
        },
        description:{type: String},

        air    :{
            company: {type: Number, default: 0},
            self   : {type: Number, default: 0}
        },
        train  :{type: Number, default: 0},
        bus    :{type: Number, default: 0},
        taxi   :{type: Number, default: 0},
        selfdrive:{
            kilometer: {type: Number, default: 0},
            roadtoll:  {type: Number, default: 0},
            parkingfee: {type: Number, default: 0},
            selfdriveAmount: {type: Number, default: 0}
        },
        accommodationDay :{type: Number, default: 0},
        accommodationAmount: {type: Number, default: 0},
        diningNumber :{type: Number, default: 0},
        diningAmount :{type: Number, default: 0},
        isafter     :{type: Boolean,default: false},
        isdelete    :{type: Boolean,default: false},
        status      :{type: Number, default: 0},
        reason      :{type: String, default: ''},
        manager     :{type: ObjectId, ref: 'Employees', default: null},
        isApproved :{type: Boolean,default: false},
        isApprovedTwo :{type: Boolean,default: false},
        isPaid     :{type: Boolean,default: false},
        createdBy   :{
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy   :{
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },
        workflow   :{type: ObjectId, ref: 'workflows', default: null}
    }, {collection: 'busiTrip'});

    mongoose.model('busiTrip', busiTripSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.busiTrip = busiTripSchema;
})();
