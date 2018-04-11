/**
 * Created by wmt on 2017/7/28.
 */
'use strict';
var mongoose = require('mongoose');
var payRollSchema = mongoose.Schemas.PayRoll;

module.exports = function (models) {
    return new function () {

        this.getPaidAndAttenForRoyalty = function (options, callback) {
            var dbName;
            var err;
            var depRoyalty = options.depRoyalty;
            var paidWages = 0;
            var effecAtten = 0;
            var PayRoll;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (typeof callback !== 'function') {
                callback = function () {
                    return false;
                };
            }

            dbName = options.dbName;
            delete options.dbName;

            if (!dbName) {
                err = new Error('数据库名称错误！');
                err.status = 400;

                return callback(err);
            }

            PayRoll = models.get(dbName, 'PayRoll', payRollSchema);

            PayRoll.aggregate([{
            	$match: {
            		employee : depRoyalty.person,
            		year     : depRoyalty.year
            	}
            },{
            	$project: {
            		calc       : 1,
                    effecAtten : 1
            	}
            }], function (err, result) {

                if (err) {
                    return callback(err);
                }

                for(var i=0; i<result.length; i++){
                	paidWages = paidWages + result[i].calc;
                    effecAtten = effecAtten + result[i].effecAtten;
                }

                depRoyalty.paidWages = paidWages;
                depRoyalty.effecAtten = effecAtten;
                callback(null, depRoyalty);
            });
        };
    };
};

