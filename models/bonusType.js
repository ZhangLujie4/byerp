/**
 * 将mongodb获取的值以规定的模型骨架构建并返回bonusTypeSchema这个集合
 */
module.exports = (function () {
    var mongoose = require('mongoose');

    //构建模型骨架
    var bonusTypeSchema = mongoose.Schema({
        ID       : Number,
        name     : {type: String},
        bonusType: {type: String, enum: ['HR', 'Sales', 'Developer', 'PM'], default: 'Developer'},
        value    : {type: Number},
        isPercent: {type: Boolean}
    }, {collection: 'bonusType'});

    //由schema解析数据库中文档，并可对model进行增删改查
    mongoose.model('bonusType', bonusTypeSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    //返回集合
    mongoose.Schemas.bonusType = bonusTypeSchema;
})();
