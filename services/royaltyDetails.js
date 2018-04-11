/**
 * Created by wmt on 2017/7/27.
 */
'use strict';
var mongoose = require('mongoose');
var royaltyDetailsSchema = mongoose.Schemas.royaltyDetails;

module.exports = function (models) {
    return new function () {

        this.getRoyaltyByPersonAndYear = function (options, callback) {
            var dbName;
            var err;
            var depRoyalty = options.depRoyalty;
            var commission = 0;
            var RoyaltyDetails;

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

            RoyaltyDetails = models.get(dbName, 'royaltyDetails', royaltyDetailsSchema);

            RoyaltyDetails.aggregate([{
            	$lookup: {
		            from        : 'Opportunities',
		            localField  : 'project',
		            foreignField: '_id',
		            as          : 'project'
            	}
            },{
            	$project: {
            		project  : {$arrayElemAt: ['$project', 0]},
            		comRate  : 1,
            		diffCoef : 1,
            		persons  : 1
            	}
            },{
            	$project: {
            		'project._id'       : '$project._id',
            		'project.bidCost'   : '$project.bidCost',
            		'project.biderDate' : '$project.biderDate',
            		'project.biderYear' : {$year: '$project.biderDate'},
            		comRate             : 1,
            		diffCoef            : 1,
            		persons             : 1      
            	}
            },{
            	$match: {
            		'project.biderYear' : depRoyalty.year
            	}
            },{
            	$project: {
            		project  : 1,
            		comRate  : 1,
            		diffCoef : 1,
            		persons  : 1

            	}
            }], function (err, result) {

                if (err) {
                    return callback(err);
                }

                for(var i=0; i<result.length; i++){
                    var totalPay = result[i].project.bidCost*result[i].comRate/100;
                    for(var j=0; j<result[i].persons.length; j++){
                        var everyPay = totalPay*result[i].persons[j].scale/100 - result[i].persons[j].deductions;
                        if(result[i].persons[j].name.equals(depRoyalty.person)){
                            commission = commission + everyPay;
                        }
                    }
                }
                callback(null, commission);
            });
        };
    };
};

