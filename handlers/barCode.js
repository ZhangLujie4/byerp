var mongoose = require('mongoose');
var async = require('async');
var _ = require('lodash');
var moment = require('../public/js/libs/moment/moment');
var ean13 = require('../helpers/ean13.js');
var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;
var CONSTANTS = require('../constants/mainConstants');

var barCode = function (models) {
    'use strict';

    var barCodeSchema = mongoose.Schemas.barCode;
    var projectSchema = mongoose.Schemas.Project;
    var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
    var plantWorkGroupSchema = mongoose.Schemas.plantWorkGroup;
    var scanlogSchema = mongoose.Schemas.scanlog;
    var GoodsOutSchema = mongoose.Schemas.GoodsOutNote;
    var produceScheduleSchema = mongoose.Schemas.ProduceSchedule;
    var shippingNoteSchema = mongoose.Schemas.shippingNote;
    var AluveneerOrdersHandler = require('./aluveneerOrders');
    var aluveneerOrder = new AluveneerOrdersHandler(models);

    this.getBarList = function(req,res,next){
        var retObj = {};
        var groupid = req.params.groupid;
        var db = req.session.lastDb;
        var barModel = models.get(db,'barCode',barCodeSchema);
        var groupModel = models.get(db,'plantWorkGroup',plantWorkGroupSchema);
        var produceScheduleModel = models.get(db, 'produceSchedule', produceScheduleSchema);
        var aluveneerOrderModel = models.get(db, 'aluveneerOrders', aluveneerOrdersSchema);
        var selectProj = req.body.data;
        selectProj = JSON.parse(selectProj);

        function getOrder(cb){
            async.map(selectProj, function(item, asyncCb){
                aluveneerOrderModel.aggregate([
                    {
                        $lookup: {
                            from: 'building',
                            localField: 'projectName',
                            foreignField: '_id',
                            as: 'projectName'
                        }
                    },
                    {
                        $project: {
                            projectName: {$arrayElemAt: ['$projectName', 0]},
                            cgdh: 1,
                            priApproval: 1
                        }
                    },
                    {
                        $match: {
                            'projectName.name': item.projectName,
                            cgdh: item.cgdh,
                            priApproval: true
                        }
                    }
                ], function(err, result){
                    if(err){
                        return asyncCb(err)
                    }
                    asyncCb(null, result);
                })
            }, function(err, orders){
                if(err){
                    cb(err)
                }
                orders = _.flatten(orders);
                var orderId = [];
                orders.forEach(item => orderId.push(objectId(item._id)));
                cb(null, orderId);
            })
        }

        function getBarcode(orders, cb){
            groupModel
            .find({$and:[{_id:groupid},{status:true}]})
            .exec(function(err,response){
                if(err){
                    return cb(err);
                }
              
                if(!response[0]){
                    retObj.retStatus='Fail';
                    retObj.retError='你所在小组已撤销！';
                    cb(retObj);
                }
                else{
                    var routing = response[0].workCentre;
                    barModel
                    .find({curWorkCentre:routing, orderRowId: {$in: orders}})
                    .exec(function(err,result){
                        if(err){
                            return cb(err);
                        }
                        console.log('barcode',result);
                        if(!result){
                            retObj.retStatus='Fail';
                            retObj.retError='你所在小组没有要进行扫描的条码！';
                            cb(null, retObj);
                        }
                        else{
                            retObj.retStatus='OK';
                            retObj.retValue=result;
                            cb(null, retObj);
                        }

                });
             }
        });
        }

        async.waterfall([getOrder, getBarcode], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        })

    };

    this.putBarCodeScanInfo = function(req, res, next){
        var db = req.session.lastDb;
        var retObj = {};
        var scanMan;
        var barId =  req.body.barId;
        var group_id = req.body.groupId;
        var scanTime = req.body.barScanDate;
        var note = req.body.remark;
        var barCodeModel = models.get(db,'barCode',barCodeSchema);   
        var groupModel = models.get(db,'plantWorkGroup',plantWorkGroupSchema);
        var scanlogModel = models.get(db, 'scanlogs', scanlogSchema);
        var shippingNoteModel = models.get(db, 'shippingNote', shippingNoteSchema);
        groupModel
        .find({_id:group_id})
        .exec(function(err,groupinfo){
            if(err){
                return next(err);
            }

            if(!groupinfo[0]){
                retObj.retStatus='Fail';
                retObj.retError='该小组不存在，无法上传条码';
                res.status(200).send(retObj);
            }else{
                barCodeModel
                .find({barId:barId})
                .populate('curWorkCentre', 'code name')
                .populate('orderRowId', 'dkjjmj totalPrice')
                .exec(function(err,barinfo){

                    if(err){
                        return next(err);
                    }

                    if(!barinfo[0]){
                        retObj.retStatus='Fail';
                        retObj.retError='该条码不存在，无法上传条码';
                        res.status(200).send(retObj);
                    }
                    else if(barinfo[0].curWorkCentre._id.toString() != groupinfo[0].workCentre.toString()){
                        retObj.retStatus='Fail';
                        retObj.retError='该条码已扫过';
                        res.status(200).send(retObj);
                    }
                    else{
                        if(barinfo[0].curWorkCentre._id.toString() == groupinfo[0].workCentre.toString()){
                            function findNextRouting(cb){
                                var infos ={
                                    _id:barinfo[0].orderRowId,
                                    workCentre: barinfo[0].curWorkCentre._id
                                }
                                aluveneerOrder.getNextRouting(infos,req,cb);
                            };

                            function updateBarInfoes (response,cb){
                                var nextRouting;
                                var price;
                                var area;
                                var update;
                                nextRouting = response.nextRouting;
                                price = response.price;
                                area = response.dkjjmj;
                                if(barinfo[0].curWorkCentre.code == CONSTANTS.SHIPPINGCODE){
                                    update = {$push:{barInfoes:{scanTime:scanTime, groupid:group_id, price:price}},$set:{curWorkCentre:nextRouting, status: 'Done'}}
                                }
                                else{
                                    update = {$push:{barInfoes:{scanTime:scanTime, groupid:group_id, price:price}},$set:{curWorkCentre:nextRouting}}
                                }
                                barCodeModel
                                .findOneAndUpdate({barId:barId},update,{new:true},function(err,result){

                                    if(err){
                                        return next(err);
                                    }

                                    retObj.retStatus='OK';
                                    retObj.retValue=result;
                                    retObj.price = price;
                                    retObj.area = area;
                                    cb(null,retObj);
                                });
                            };

                            function saveScanlog(response, cb){
                                var data ={
                                    barCode: barinfo[0]._id,
                                    workGroup: group_id,
                                    workCentre: groupinfo[0].workCentre,
                                    scantime: scanTime,
                                    uploadtime: new Date(),
                                    note: note,
                                    price: response.price,
                                    area: response.area
                                }

                                var scanlog = new scanlogModel(data);
                                scanlog.save(function(err, result){
                                    if(err){
                                      cb(err);
                                    }
                                    else{
                                      retObj.retStatus='OK';
                                      retObj.retValue= response.retValue;
                                      cb(null, null); 
                                    }
                                })
                            }

                            function insertBarToShippingNote(response, cb){
                                var goodsOutNoteId = barinfo[0].goodsOutNote;
                                var area = barinfo[0].orderRowId.dkjjmj;
                                var price = barinfo[0].orderRowId.totalPrice;
                                shippingNoteModel.find({goodsOutNote: goodsOutNoteId}, function(err, result){
                                    if(err){
                                        cb(err);
                                    }
                                    if(result.length){
                                        shippingNoteModel.findOneAndUpdate({goodsOutNote: goodsOutNoteId}, {$push: {barCodes: barinfo[0]._id}, $inc: {area: area, price: price}}, function(err, result){
                                            if(err){
                                                cb(err)
                                            }
                                            cb(null, null);
                                        })
                                    }
                                    else{
                                        var body = {
                                            goodsOutNote: goodsOutNoteId,
                                            barCodes: [barinfo[0]._id],
                                            shipDate: new Date(),
                                            area: area,
                                            price: price
                                        }
                                        var shippingNote = new shippingNoteModel(body)
                                        shippingNote.save(function(err, result){
                                            if(err){
                                                cb(err)
                                            }
                                            cb(null, null)
                                        })
                                    }
                                })
                            }

                            if(barinfo[0].curWorkCentre.code == CONSTANTS.SHIPPINGCODE){
                                async.waterfall([findNextRouting,updateBarInfoes,saveScanlog,insertBarToShippingNote],function(err,result){
                                    if(err){
                                        return next(err);
                                    }
                                    retObj.retStatus='OK';
                                    retObj.retValue='上传成功';
                                    res.status(200).send(retObj);
                                });
                            }
                            else{
                                async.waterfall([findNextRouting,updateBarInfoes,saveScanlog],function(err,result){
                                    if(err){
                                        return next(err);
                                    }
                                    retObj.retStatus='OK';
                                    retObj.retValue='上传成功';
                                    res.status(200).send(retObj);
                                });
                            }
                            
                        }else{
                            retObj.retStatus='Fail';
                            retObj.retError='条码所在工序错误！';
                            res.status(200).send(retObj);
                        }
                    }

                });

            }
        });
    };

    this.getBarcodeInfo = function(req,res,next){
        var db = req.session.lastDb;
        var retObj = {};
        var barid = req.params.barid;
        var barCodeModel = models.get(db,'barCode',barCodeSchema);
        var projectModel = models.get(db,'Project',projectSchema);
        var aluveneerOrderModel = models.get(db,'aluveneerOrders',aluveneerOrdersSchema);

        barCodeModel.aggregate([{
            $match:{
                barId:barid
            }
        },{
            $lookup:{
               from        : 'aluveneerOrders',
               localField  : 'orderRowId',
               foreignField: '_id',
               as          : 'projName'
            }
        },{
            $project:{
                projName:{$arrayElemAt: ['$projName', 0]},
            }
        },{
            $project:{
                'projName.projectName':'$projName.projectName',
                'projName.lbbh'       :'$projName.lbbh',
                'projName.lbmc'       :'$projName.lbmc',
                'projName.dkjjmj'     :'$projName.dkjjmj',
                'projName.sfyx'       :'$projName.sfyx',
                'projName.jgsh'       :'$projName.jgsh',
                'projName.jgth'       :'$projName.jgth',
                'projName.cgdh'       :'$projName.cgdh',
                'projName.W'          :'$projName.W',
                'projName.L1'         :'$projName.L1',
                'projName.L2'         :'$projName.L2',
                'projName.L3'         :'$projName.L3',
                'projName.L4'         :'$projName.L4',
                'projName.L5'         :'$projName.L5',
                'projName.L6'         :'$projName.L6'
            }
        },{
            $lookup:{
               from        : 'building',
               localField  : 'projName.projectName',
               foreignField: '_id',
               as          : 'projName.projectName'
            }
        },{
            $project:{
                'projName.projectName':{$arrayElemAt: ['$projName.projectName', 0]},
                'projName.lbbh'       :1,
                'projName.lbmc'       :1,
                'projName.dkjjmj'     :1,
                'projName.sfyx'       :1,
                'projName.jgsh'       :1,
                'projName.jgth'       :1,
                'projName.cgdh'       :1,
                'projName.W'          :1,
                'projName.L1'         :1,
                'projName.L2'         :1,
                'projName.L3'         :1,
                'projName.L4'         :1,
                'projName.L5'         :1,
                'projName.L6'         :1
            }
        },{
            $project:{
                'projName.projectName.name':'$projName.projectName.name',
                'projName.lbbh'       :1,
                'projName.lbmc'       :1,
                'projName.dkjjmj'     :1,
                'projName.sfyx'       :1,
                'projName.jgsh'       :1,
                'projName.jgth'       :1,
                'projName.cgdh'       :1,
                'projName.W'          :1,
                'projName.L1'         :1,
                'projName.L2'         :1,
                'projName.L3'         :1,
                'projName.L4'         :1,
                'projName.L5'         :1,
                'projName.L6'         :1
            }
        }],function(err,infos){
                if(err){
                    return next(err);
                }

                if(!infos[0]){
                    retObj.retStatus='Fail';
                    retObj.retError='没有找到该条码详细信息';
                    res.status(200).send(retObj);
                }else{
                    retObj.retStatus='OK';
                    retObj.retValue=infos[0];
                    res.status(200).send(retObj);
                }
            });
    };

    this.getWorkLoadOfDay = function(req,res,next){
        var db = req.session.lastDb;
        var retObj = {};
        var workid = req.body.workid;
        var start = req.body.startdate;
        var end = req.body.enddate;
        var barCodeModel = models.get(db,'barCode',barCodeSchema);
        var groupModel = models.get(db,'plantWorkGroup',plantWorkGroupSchema);
        var startdate = moment(start).utc();
        var enddate = moment(end).add(1,'days').utc();
        var starttime = new Date(startdate);
        var endtime = new Date(enddate);
        var barHistory = [];
        
        groupModel
        .find({$or:[{leader:workid},{members:workid}]})
        .exec(function(err,groups){
            
            if(err){
                return next (err);
            }

            if(groups.length == 0){
                retObj.retStatus = 'Fail';
                retObj.retError = '没有找到历史工作小组'
                res.status(200).send(retObj);
            }else{
                async.map(groups,function(each,cb){
                    var groupid = each._id;
                    barCodeModel.aggregate([
                        
                        {
                            $match:{
         
                                $and:[
                                {
                                    'barInfoes.groupid':groupid
                                },{
                                    'barInfoes.scanTime':{
                                        $gte:new Date(startdate),
                                        $lte:new Date(enddate)
                                    }
                                }
                                ]
                            }
                        },{   
                            $project:{
                                barId:1,
                                barInfoes:{
                                    $filter:{
                                        input:'$barInfoes',
                                        as : 'item',

                                        cond :{
                                            $and:[
                                                {
                                                    $eq:['$$item.groupid',groupid]
                                                },{
                                                        $gte:['$$item.scanTime',starttime]
                                                },{
                                                        $lte:['$$item.scanTime',endtime]
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                           
                        }
                        ],function(err,response){
                            
                        if(err){
                            return next(err);
                        }

                        cb(null,response);
                    });
                },function(err,result){
                    if(err){
                        return next(err);
                    }

                    var history = _.flatten(result);
                    if(history.length == 0){
                       retObj.retStatus='Fail';
                       retObj.retError='没有找到历史记录';
                       res.status(200).send(retObj);
                   }else{
                        for(var i=0;i<history.length;i++){
                            var bar = history[i].barId;
                            for (var j=0;j<history[i].barInfoes.length;j++){
                                var price = history[i].barInfoes[j].price;
                                var data ={
                                    barId:bar,
                                    price:price
                                }
                                barHistory.push(data);
                            }
                        }
                    
                        retObj.retStatus='OK';
                        retObj.retValue=barHistory;
                        res.status(200).send(retObj);
                    }   
                });
            }
        });
    };


    this.findByCondition = function(req,res,next){
        var db = req.session.lastDb;
        var barCodeModel = models.get(db,'barCode',barCodeSchema);
        var dataObj = req.body;
        var condition = JSON.parse(dataObj.condition);
        var condition = JSON.parse(dataObj.condition);
        var skipto ;
        var limit ;
        var sortby;
        var datelimit;
        if(dataObj.skipto) skipto = dataObj.skipto ; else skipto = 0; 
        if(dataObj.limit) limit = dataObj.limit ;else limit = 100; 
        if(dataObj.sortby) sortby = dataObj.sortby; else sortby ='';

        var retObj = {};
        barCodeModel.count(condition, function(err, doc){
            if(err){
                retObj.retError = err;
                retObj.retStatus = 'Fail';
                res.json(retObj);
            }else{
                retObj.retCount = doc;
                barCodeModel.findByCondition(condition,sortby,skipto,limit,function(_err,_doc){
                    if(_err){
                        retObj.retError = _err;
                        retObj.retStatus = 'Fail';
                        res.json(retObj);
                    }else{
                        retObj.retStatus = 'OK';
                        retObj.retValue = _doc;
                        res.json(retObj);
                    }
                });
            }
        });   
    };

    this.createBarCode = function(req,callback,infos){
        var db = req.session.lastDb;
        var barCodeModel = models.get(db,'barCode',barCodeSchema);
        var orders = infos;
        var projName = orders._id;
        var currentRouting = orders.routing[0].jobId;
        var barCode;
        orders.sl;

        var i = 0;
        async.whilst(
            function(){return i < orders.sl},
            function(cb){
                barCode = new EAN13('11710','1234567');
                var data = {
                    projName:projName,
                    currentRouting:currentRouting,
                    barId:barCode
                }
                var model = new barCodeModel(data);
                model.save(function(err,result){
                    if(err){
                        return cb(err);
                    }
                    i++;
                   
                    cb();
                });
            },
            function(err){
                if (err){
                    return callback(err);
                }
                var response = {success: 'barCode create success'};
               callback(null,infos);
            });
    };
    
    this.getByOrderRowId = function(req, res, next){
        var db = req.session.lastDb;
        var Model = models.get(db,'barCode',barCodeSchema);
        var orderRowId = req.params.orderRowId;
        var mid = req.query.mid;

        if(mid === "1"){
            Model.find({orderRowId : orderRowId})
                .populate('curWorkCentre', '_id code')
                .exec(function (err, barCodes) {
                    var results = [];

                    if (err) {
                        next(err);
                    }

                    if(barCodes.length){
                        for(var i =0; i<barCodes.length; i++){
                            if(barCodes[i].curWorkCentre.code === "07"){
                                results.push(barCodes[i]);
                            }
                        }
                    }
                    res.status(200).send(results);
            });
        }else if(mid === "2"){
            Model.find({orderRowId : orderRowId})
                .populate('curWorkCentre', '_id code')
                .exec(function (err, barCodes) {
                    var results = [];

                    if (err) {
                        next(err);
                    }

                    if(barCodes.length){
                        for(var i =0; i<barCodes.length; i++){
                            if(barCodes[i].curWorkCentre.code === "07"){
                                results.push(barCodes[i]);
                            }
                        }
                    }
                    res.status(200).send(results);
            });
        }
    };

    this.getById = function (req, res, next) {
        var db = req.session.lastDb;
        var response = {};
        response.data = [];
        models.get(db, 'barCode', barCodeSchema).find({}, function (err, result) {
            
            if (err) {
                return next(err);
            }

            response.data = result;
            res.send(response);
        }).sort({'barId' : 1});
    };

    this.getGoodsOutBarList = function(req, res, next){
        var db = req.session.lastDb;
        var retObj = {};
        var groupid = req.params.groupid;
        var GoodsOutNote = models.get(db, 'GoodsOutNote', GoodsOutSchema);
        var barCodeModel = models.get(db,'barCode',barCodeSchema);
        var groupModel = models.get(db,'plantWorkGroup',plantWorkGroupSchema);
        var name = JSON.parse(req.body.data);
        name = name.name;
        function getBarCodesId(callback){
            GoodsOutNote.aggregate([
                {
                    $match: {
                        name: name
                    }
                },
                {
                    $project: {
                        orderRows: 1
                    }
                }
                ],function(err, result){
                    if(err){
                        return next(err);
                    }
                    var barCodes = [];
                    for(var i=0; i<result.length; i++){
                        for(var j=0; j<result[i].orderRows.length; j++){
                            barCodes = _.union(result[i].orderRows[j].barCodes, barCodes);
                        }
                    }

                    callback(null, barCodes);
                });
        }

        function getBarCodesInfo(barCodes, callback){
            groupModel
            .find({$and:[{_id:groupid},{status: true}]})
            .exec(function(err,response){
                if(err){
                    return callback(err);
                }
              
                if(!response[0]){
                    retObj.retStatus='Fail';
                    retObj.retError='你所在小组已撤销！';
                    callback(retObj);
                }
                else{
                    async.map(barCodes, function(barCode, asyncCb){
                        barCodeModel.find({_id: objectId(barCode), status: 'Progress'}, function(err, barInfo){
                            if(err){
                                return asyncCb(err);
                            }
                            if(barInfo.length){
                                asyncCb(null, barInfo[0]);
                            }
                            else{
                                asyncCb(null, null);
                            }
                        })
                    },function(err, result){
                        if(err){
                            return next(err);
                        }
                        if(!result.length){
                            retObj.retStatus='Fail';
                            retObj.retError='你所在小组没有要进行扫描的条码！';
                            callback(null, retObj);
                        }
                        else{
                            result = _.compact(result);
                            retObj.retStatus='OK';
                            retObj.retValue=result;
                            callback(null, retObj);
                        }
 
                    })
                }
            });
        }

        async.waterfall([getBarCodesId, getBarCodesInfo], function(err, result){
            if(err){
                return next(err);
            }
            res.status(200).send(result);
        })
        
    };

};

module.exports = barCode;
