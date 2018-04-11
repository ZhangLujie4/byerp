module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var timeCardSchema;

    timeCardSchema = mongoose.Schema({
        ID         : Number,
        empid      : Number,  // employee id
        name       : String,
        project    : {type: ObjectId, ref: 'Project', default: null},
        employee   : {type: ObjectId, ref: 'Employees', default: null},
        department : {type: ObjectId, ref: 'Department', default: null},
        year       : Number,
        month      : Number,
        day        : Number,
        amin       : String,
        amout      : String,
        pmin       : {type: String},
        pmout      : {type: String},
        otin       : {type: String},
        otout      : {type: String},
        worked     : Number,
        rate       : Number,
        otrate     : Number,
        _type      : {type: String, default: 'ordinary'},
        isPaid     : {type: Boolean, default: false},
        invoice    : {type: ObjectId, ref: 'Invoice', default: null},
        earlyam: {type: Number},
        earlypm: {type: Number},
        lateram: {type: Number},
        laterpm: {type: Number},

        whoCanRW: {type: String, enum: ['owner', 'group', 'everyOne'], default: 'everyOne'},

        groups: {
            owner: {type: ObjectId, ref: 'Users', default: null},
            users: [{type: ObjectId, ref: 'Users', default: null}],
            group: [{type: ObjectId, ref: 'Department', default: null}]
        },

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },

        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },

        jobs: {type: ObjectId, ref: 'jobs', default: null}
    }, {collection: 'timeCard'});

    timeCardSchema.set('toJSON', {getters: true});

    mongoose.model('timeCard', timeCardSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.timeCard = timeCardSchema;
})();
