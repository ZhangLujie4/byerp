/**
 * 用来将数据进行分页处理(获得skip和count值)
 */
var CONSTANTS = require('../constants/mainConstants.js');
var Module = function (data) {
    "use strict";
    var count = data.count;
    var page = data.page || 1;
    var skip;

    //以十进制将count转换成int
    count = parseInt(count, 10);
    count = !isNaN(count) ? count : CONSTANTS.COUNT_PER_PAGE;
    page = parseInt(page, 10);
    page = !isNaN(page) && page ? page : 1;
    skip = (page - 1) * count;

    /**
     * skip:指定跳过的数据条数
     * count:读取数据条数
     */
    return {
        skip : skip,
        limit: count
    };
};

module.exports = Module;
