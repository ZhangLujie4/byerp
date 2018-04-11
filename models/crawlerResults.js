/**
 * Created by wmt on 2017/7/17.
 */
//加载crawler类型
module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var crawlerResultsSchema = new mongoose.Schema({
        id         : {type: String, default: null},
        createTime : {type: String, default: null},
        dayTime    : {type: String, default: null},
        classId    : Number,
        minPrice   : Number,
        maxPrice   : Number,
        yAverage   : Number,
        average    : Number,
        move       : Number,
        isCrawler  : {type: Boolean, default: true}
    }, {collection: 'crawlerResults'});

    mongoose.model('crawlerResults', crawlerResultsSchema);
    mongoose.Schemas.crawlerResults = crawlerResultsSchema;
})();