module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;


    var workTimeSchema = mongoose.Schema({
 

        monthstart: Date,
        monthend: Date,
        ondutystart:String,
        ondutyset:String,
        ondutyend:String,
        offdutystart:String,
        offdutyset:String,
        offdutyend:String,
        employmentType:String,
       // employmentTypeTiset: {type: ObjectId, ref: 'employeeTy', default: null}
       //employmentTypeTiset: {type: String, enum: ['administrationset', 'workeramset', 'workerpmset','workernightset','projectmanagementset'], default: 'administrationset'}
       employmentTypeTiset: {type: String, enum: ['行政', '车间早班', '车间中班','车间晚班','工程管理'], default: '工程管理'}
    },{collection: 'workTimes'});
      

    mongoose.model('workTime', workTimeSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.workTime = workTimeSchema;
})();
