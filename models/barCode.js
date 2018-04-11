module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var barInfo = {
      groupid : {type: ObjectId, ref:'plantWorkGroup',  default:null},
      scanTime: {type: Date},
      price   : {type: Number, default: 0}
    };

    var barCodeSchema = mongoose.Schema({
       barId         : {type: String, defalut:''},
       orderRowId    : {type: ObjectId, ref:'aluveneerOrders', default:null},
       barInfoes     : [barInfo],
       curWorkCentre : {type: ObjectId,ref:'workCentre', default:null},
       status        : {type: String, default: 'New'},
       goodsOutNote  : {type: ObjectId, ref: 'goodsNote', defalut: null}
    }, {collection   : 'barCode'});

    mongoose.model('barCode', barCodeSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    var findByCondition = function(condition,sortby,skip,limit,cb){

      if(sortby == "_id") 
        sortby = {_id:-1};
      if(sortby == "") 
        sortby = "_id";

      return this
      .find(condition)
      .sort(sortby)
      .skip(skip)
      .limit(limit)
      .exec(cb);
    };

    barCodeSchema.statics = {
      findByCondition : findByCondition
    }
    mongoose.Schemas.barCode = barCodeSchema;


})();
