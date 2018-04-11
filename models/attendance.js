module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var attendanceSchema;

    attendanceSchema = mongoose.Schema({
        year: Number,
        month: Number,
        day: Number,
        empid: String,
        employee: {type: ObjectId, ref: 'Employees', default: null},
        name: String,
        late: Number,
        early: Number
    }, {collection: 'attendances'});

    attendanceSchema.set('toJSON', {getters: true});

    mongoose.model('attendance', attendanceSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.attendance = attendanceSchema;
})();
