var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
var buildingContractSchema = mongoose.Schemas.BuildingContract;
var opportunitiesSchema = mongoose.Schemas.Opportunitie;
var crawlerResultsSchema = mongoose.Schemas.crawlerResults;
var designRecSchema = mongoose.Schemas.DesignRec;
var marketSettingsSchema = mongoose.Schemas.marketSettings;
var jobPositionSchema = mongoose.Schemas.JobPosition;
var buildingSchema = mongoose.Schemas.Building;
var workCentreSchema = mongoose.Schemas.workCentre;
var produceScheduleSchema = mongoose.Schemas.ProduceSchedule;
var orderSchema = mongoose.Schemas.Order;
var OrderRowsSchema = mongoose.Schemas.OrderRow;
var barCodeSchema = mongoose.Schemas.barCode;
var objectId = mongoose.Types.ObjectId;
var _ = require('underscore');
var async = require('async');

var Module = function (models, event) {
    'use strict';

    var validator = require('../helpers/validator');

    var fs = require('fs');
    var path = require('path');
    var Uploader = require('../services/fileStorage/index');
    var pageHelper = require('../helpers/pageHelper');
    var uploader = new Uploader();
    var FilterMapper = require('../helpers/filterMapper');
    var xlsx = require('node-xlsx');

    this.createAluveneerOrder = function (req, res, next) {
        var body = req.body;
        var aluveneerOrders;
        var error;
        var AluveneerOrdersModel = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);

        body.uId = req.session.uId;
        
        //body.editedBy.user = body.uId;
        //body.editedBy.date = new Date();
        aluveneerOrders = new AluveneerOrdersModel(body);
        aluveneerOrders.save(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });


    };


    this.uploadFile = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var headers = req.headers;
        var id = headers.modelid || 'empty';
        var contentType = headers.modelname || 'aluveneerOrders';
        var files = req.files && req.files.attachfile ? req.files.attachfile : null;
        var dir;
        var err;

        contentType = contentType.toLowerCase();
        dir = path.join(contentType, id);

        if (!files) {
            err = new Error(RESPONSES.BAD_REQUEST);
            err.status = 400;

            return next(err);
        }

        uploader.postFile(dir, files, {userId: req.session.uName}, function (err, file) {
            var notes = [];
            if (err) {
                return next(err);
            }

            Model.findByIdAndUpdate(id, {$push: {attachments: {$each: file}}}, {new: true}, function (err, response) {
                if (err) {
                    return next(err);
                }

                response.fileStatus = '文件已上传';
                response.uploadDate = new Date();

                Model.findByIdAndUpdate(id, response, function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    
                });

                res.status(200).send({success: 'aluveneerOrders updated success', data: response});
            });

        });

    };

    this.aluveneerOrderUpdate = function (req, res, next) {
        var AluveneerOrdersSchema = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var WorkCentreSchema = models.get(req.session.lastDb, 'workCentre', workCentreSchema);
        var _id = req.params._id;
        var data = req.body;
        delete data._id;
        var routings = [];
        var date = new Date();

        routings = req.body.routing.split("-");

        function workCentreReplace(callback){

            async.map(routings, function (rout, cb) {
                if(rout != ''){
                    WorkCentreSchema.findOne({code: rout} ,function (err, workCentre) {
                        if (err) {
                            return err(err);
                        }
                        else if(workCentre) {
                            var jobName = workCentre.name;
                            var jobId = workCentre._id;
                            var price = workCentre.costPerHour/100;
                            var jobNumber = workCentre.code;

                            var data = {
                                jobName : jobName,
                                jobId   : jobId,
                                price   : price,
                                jobNumber : jobNumber
                            }

                            cb(null, data);

                        }

                    });
                }
                else{
                    cb(null, false);
                }

            }, function (err, tempData) {
                if (err) {
                    return next(err);
                }                

                callback(null, tempData);

            });


        };

        function updateTotal(tempData, callback){
            var uId = req.session.uId;
            var date = new Date();

            data.editedBy = {
                user: uId,
                date: date
            }

            if(!tempData[0]){
                delete data.routing;
            }
            else{
                data.routing = tempData;
            }

            AluveneerOrdersSchema.findByIdAndUpdate(_id, data, function (err, result1) {
                if (err) {
                    return next(err);
                }

                callback(null, result1);

            });

        };

        async.waterfall([workCentreReplace, updateTotal], function(err, excelResult){

            if(err){
                return next(err);
            }

            var response = {};

            if (err) {
                return next(err);
            }

            response.data = excelResult;
           
            res.status(200).send(response);
        });

    };

    this.getByViewType = function (req, res, next) {
        var data=req.query;
        //var viewType = req.query.viewType;
        var filter = data.filter||{};

        if(filter.id){
            getForm(req, res, next);
        } 
        else{
            getList(req, res, next);
        }
    };

    function getList(req, res, next) {
        var AluveneerOrdersSchema = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var keys;
        var parallelTasks;
        var filterObj = {};
        var optionsObject = [];
        var filter = data.filter || {};
        var contentType = data.contentType || 'aluveneerOrders';
        var filterMapper = new FilterMapper();

        if (filter) {
            filterObj = filterMapper.mapFilter(filter, contentType); // caseFilterOpp(filter);
        }

        optionsObject.push(filterObj);
        
        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'projectName': -1};
        }   

        AluveneerOrdersSchema.aggregate([     
            {
                $lookup: {
                    from        : 'building',
                    localField  : 'projectName',
                    foreignField: '_id',
                    as          : 'projectName'
                }
            }, 
            {
                $project: {
                    projectName  : {$arrayElemAt: ['$projectName', 0]},
                    cgdh         : 1,
                    zmj          : 1,
                    sl           : 1
                }
            }, {
                $match: {
                    $and: optionsObject
                }
            }, 
            {
                $group: {
                    _id  : {cgdh: "$cgdh", projectName: "$projectName"},
                    total: {$sum: 1},
                    totalAcreage: {$sum: "$zmj"},
                    totalQuantity: {$sum: "$sl"}
                }
            },
            {
                $project: {
                    _id             : {$concat: ['$_id.projectName.name', '-', '$_id.cgdh']},
                    projectName     : '$_id.projectName',
                    cgdh            : '$_id.cgdh',
                    total           : 1,
                    totalAcreage    : 1,
                    totalQuantity   : 1
                }
            },
            {
                $sort: sort
            },
            {
                $skip: skip
            }, 
            {
                $limit: limit
            }
            ],function (err, result) {
                var count;
                var response = {};

                if (err) {
                    return next(err);
                }

                //count = result[0] && result[0].total ? result[0].total : 0;
                count = result.length;

                response.total = count;
                response.data = result;

                res.status(200).send(response);
        });

    };


    this.bulkRemove = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            Model.findByIdAndRemove(id, function (err, aluveneerOrder) {
                if (err) {
                    return err(err);
                }

                cb();
            });

        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: true});
        });
    };


    this.remove = function (req, res, next) {
        var _id = req.params._id;
        var uId = req.session.uId;
        var date = new Date();

        var data = {
            status: 'deleted',
            editedBy: {
                user: uId,
                date: date
            }
        };

        /*models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema).findByIdAndRemove(_id, function (err, aluveneerOrder) {
            if (err) {
                return next(err);
            }

            res.send(200, {success: 'Success removed'});
        });*/

        models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema).findByIdAndUpdate(_id, data ,function (err, aluveneerOrder) {
            if (err) {
                return next(err);
            }

            res.send(200, {success: 'Success removed'});
        });

    };

    this.importexcel = function(req, res, next){
        var data = req.body;
        var file = req.files && req.files.file ? req.files.file : null;
        var aluveneerOrdersModel = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var opportunitieModel = models.get(req.session.lastDb, 'Opportunitie', opportunitiesSchema);
        var buildingContractModel = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var crawlerResultsModel = models.get(req.session.lastDb, 'crawlerResults', crawlerResultsSchema);
        var designRecModel = models.get(req.session.lastDb, 'designRec', designRecSchema);
        var marketSettingsModel = models.get(req.session.lastDb, 'marketSettings', marketSettingsSchema);
        var buildingModel = models.get(req.session.lastDb, 'building', buildingSchema);
        var workCentreModel = models.get(req.session.lastDb, 'workCentre', workCentreSchema);
        var userId = req.session.uId;
        var list = xlsx.parse(file.path);
        var xlsData = {}; 
        var tempResult = [];
        var error;
        var projectId;

        function checkBuilding(callback){

            if(list[0].data.length != 0){
                list[0].data.shift();
            };
            
            var projectName = list[0].data[0][1];
            var cgdh = list[0].data[0][3];
            
            buildingModel.findOne({name : projectName}, function (err, mod) {

                if (err) {
                    console.log(err);
                } else {
                    if (mod) {
                        projectId = mod._id;
                        callback(null,projectId);

                    } else {
                        error = new Error('不存在工程名称为: ' + projectName + ' 的建材工程');
                        error.status = 400;
                        console.log(error);
                        callback(error);
                    }
                }
            });

        };

        function checkAluOrders(projectId, callback){
           
            var projectName = list[0].data[0][1];
            var cgdh = list[0].data[0][3];
            
            aluveneerOrdersModel.find({projectName : projectId, cgdh : cgdh}, function (err, mod) {
                if (err) {
                    console.log(err);
                } else {
                    if (mod.length > 0) {
                        error = new Error('已上传过该工程，无法再上传');
                        error.status = 400;
                        console.log(error);
                        callback(error);

                    } else {
                        callback(null, projectId);
                    }
                }
            });

        };

        function getTotalPrice(projectId, callback){

            var projectName = list[0].data[0][1];
            var totalPrice = [];

            buildingContractModel.findOne({projectName : projectId})
                .populate('inventory.product' , 'name')
                .exec(function (err, building) {
                    
                    if (err) {
                        console.log(err);
                    } else {

                        if (building) {

                            totalPrice.projectId = projectId;
                            totalPrice.inventoryCost = building.inventory;
                            totalPrice.aluminumCost = building.aluminum;
                            callback(null,totalPrice);
                           
                        } else {
                            error = new Error('不存在工程名称为: ' + projectName + ' 的建材合同');
                            error.status = 400;
                            console.log(error);
                            callback(error);
                        }
                    }
                });

        };

        function checkProduct(totalPrice, callback){
            var inventoryCost = totalPrice.inventoryCost;
            var projectName = list[0].data[0][1];
            var cgdh = list[0].data[0][3];

            async.each(list,function(listObj, asyncCb){

                listObj.data.shift();
                listObj.data.shift();
                listObj.data.shift();

                async.eachSeries(listObj.data,function(listDataObj, tempList){
                    var isProdcut = false;

                    if(listDataObj[0] != null && listDataObj[0] != '总计'){
                        var lbmc = listDataObj[1];

                        async.eachSeries(inventoryCost,function(costObj, tempCost){

                            if(costObj.product.name == lbmc)
                            {   
                                isProdcut = true;
                                tempCost(null);
                            }
                            else
                            {   
                                tempCost(null);
                            }
                        }, function(err){
                            if(err){
                                return tempList(err);
                            }

                            if(isProdcut == true){
                                tempList(null);
                            }
                            else{
                                error = new Error('设计订单中有产品在建材合同中不存在,请核对');
                                error.status = 400;
                                tempList(error);
                            }

                        });
                    }
                    else
                    {
                        tempList(null);
                    }

                }, function(err){
                    if(err){
                        return asyncCb(err);
                    }
                    asyncCb(null);
                });

            }, function(err){
                if(err){
                    return callback(err);
                }
                callback(null, totalPrice, projectName, cgdh);
            });  
        }

        function checkAcreage(totalPrice, projectName, cgdh, callback){

            //var projectName = list[0].data[0][1];
            var mark = true;

            async.each(totalPrice.inventoryCost, function(inventoryObj, asyncCb){
                var productSum = 0;

                aluveneerOrdersModel.find({projectName: totalPrice.projectId, lbmc : inventoryObj.product.name}, function (err, aluveneer) {
                    var aluveneerSum = 0;
                    var tempSum;
                    
                    for(var i = 0; i < aluveneer.length; i++){
                        productSum = productSum + aluveneer[i].zmj;
                    }
                   
                    for(var j = 0; j < list[0].data.length; j++){
                        if(list[0].data[j][0] != null && list[0].data[j][0] != '总计'){
                            var lbmc = list[0].data[j][1];
                            var sl = list[0].data[j][15];
                            var dw = list[0].data[j][16];
                            var dkjjmj = list[0].data[j][17];
                            var zmj = list[0].data[j][18];
                            if(lbmc == inventoryObj.product.name){
                                aluveneerSum = aluveneerSum + zmj;
                            }
                            else{
                                aluveneerSum = aluveneerSum + 0;
                            }
                            
                        }
                    }

                    tempSum = productSum + aluveneerSum;

                    if(tempSum > inventoryObj.quantity){
                        mark = false;
                    }

                    asyncCb(null);
                });

            },function(err){
                if (err) {
                    console.log(err);
                }else{

                    if(mark == true){
                        callback(null, totalPrice, projectName, cgdh);
                    }
                    else{
                        error = new Error('面积总和已超出，无法上传，请核对');
                        error.status = 400;
                        console.log(error);
                        callback(error);
                    }
                }
            });
            
        };

        function getTotal(totalPrice, projectName, cgdh, callback){

            //var projectName = list[0].data[0][1];
            
            async.each(list,function(listObj, asyncCb){

                //var cgdh = listObj.data[0][3];

                async.eachSeries(listObj.data,function(listDataObj, tempList){

                    if(listDataObj[0] != null && listDataObj[0] != '总计'){
                        var xh = listDataObj[0];
                        var lbmc = listDataObj[1];
                        var lbbh = listDataObj[2];
                        var sfyx = listDataObj[3];
                        var sqm = listDataObj[4];
                        var cjlhf = listDataObj[5];
                        var kc = listDataObj[6];
                        var szjys = listDataObj[7];
                        var W = listDataObj[8];
                        var L1 = listDataObj[9];
                        var L2 = listDataObj[10];
                        var L3 = listDataObj[11];
                        var L4 = listDataObj[12];
                        var L5 = listDataObj[13];
                        var L6 = listDataObj[14];
                        var sl = listDataObj[15];
                        var dw = listDataObj[16];
                        var dkjjmj = listDataObj[17];
                        var zmj = listDataObj[18];
                        var boardType = listDataObj[19];
                        var jgsh = listDataObj[20];
                        var jgth = listDataObj[21];
                        var comment = listDataObj[22];
                        var routing = listDataObj[23];
                        var routings = [];
                        if(routing == null){
                            routings = [];
                        }
                        else{
                            routings = routing.split("-");
                        }                    
                        var dj = 0;
                        var ck = 0;
                        var hf = 0;
                        var kcdj = 0;
                        var hfdj = 0;
                        var tempCompare;
                        var ckbLength;
                        L1 = L1 ? L1 : 0;
                        L2 = L2 ? L2 : 0;
                        L3 = L3 ? L3 : 0;
                        L4 = L4 ? L4 : 0;
                        L5 = L5 ? L5 : 0;
                        L6 = L6 ? L6 : 0;
                        tempCompare = L1 + L2 + L3 + L4 + L5 + L6;
                        if(W > tempCompare){
                            ckbLength = tempCompare;
                        }
                        else{
                            ckbLength = W;
                        }

                        if(ckbLength >= 0 && ckbLength < 1300)
                        {
                            //dj = dj + 0;
                            ck = 0;
                        }

                        if(ckbLength >= 1300 && ckbLength < 1400)
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].notes == '1300mm以上')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    ck = totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(ckbLength >= 1400 && ckbLength < 1500)
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].notes == '1400mm以上')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    ck = totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(ckbLength >= 1500 && ckbLength < 1600)
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].notes == '1500mm以上')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    ck = totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(ckbLength >= 1600 && ckbLength < 1700)
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].notes == '1600mm以上')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    ck = totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(ckbLength >= 1700 && ckbLength < 1800)
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].notes == '1700mm以上')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    ck = totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(ckbLength >= 1800 && ckbLength < 1900)
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].notes == '1800mm以上')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    ck = totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(ckbLength >= 1900 && ckbLength < 2000)
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].notes == '1900mm以上')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    ck = totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(ckbLength >= 2000)
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].notes == '2000mm以上')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    ck = totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(sfyx == '是')
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].items == '异形板增加')
                                {
                                    dj = dj + totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        if(sqm == '是')
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].items == '双曲面')
                                {
                                    dj = dj + totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        /*if(cjlhf == '是')
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].items == '长距离焊缝')
                                {
                                    //dj = dj + totalPrice.aluminumCost[i].price;
                                    hf = cjlhf/500*totalPrice.aluminumCost[i].price;
                                }
                            }
                        }*/

                        if(szjys == '是')
                        {
                            for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                                if(totalPrice.aluminumCost[i].items == '三折及以上')
                                {
                                    dj = dj + totalPrice.aluminumCost[i].price;
                                }
                            }
                        }

                        for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                            if(totalPrice.aluminumCost[i].items == '长距离焊缝')
                            {
                                hfdj = totalPrice.aluminumCost[i].price;
                            }
                        }

                        for(var i = 0; i < totalPrice.aluminumCost.length; i++){
                            if(totalPrice.aluminumCost[i].items == '开槽')
                            {
                                kcdj = totalPrice.aluminumCost[i].price;
                            }
                        }

                        hf = cjlhf;

                        var inventoryCost = totalPrice.inventoryCost;
                        async.eachSeries(inventoryCost,function(costObj, tempCost){

                            if(costObj.product.name == lbmc)
                            {

                                marketSettingsModel.findOne({name : costObj.alumSource}, function(err, market) {
                                    var classId = market.classId;

                                    designRecModel.findOne({projectName : projectId, orderNumber : cgdh}, function (err, designRec) {
                                    
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            if (designRec) {

                                                var designTime = designRec.uploadDate.getFullYear()*10000 + designRec.uploadDate.getMonth()*100 + designRec.uploadDate.getDate() + 100;
                                                var dayTime = designTime.toString();

                                                crawlerResultsModel.findOne({dayTime : dayTime, classId : classId}, function(err, crawlerResult) {
                                                    
                                                    if(err) {
                                                        console.log(err);
                                                    } 
                                                    else if(crawlerResult) {

                                                        if(crawlerResult.average <= costObj.alumRange2 && crawlerResult.average >= costObj.alumRange1){
                                                            dj = dj + costObj.price;
                                                        }
                                                        /*else if(crawlerResult.average < costObj.alumRange1 && crawlerResult.average > (costObj.alumRange1 - costObj.alumPrice) ){
                                                            dj = dj + costObj.price - costObj.executePrice;
                                                        }*/
                                                        else if(crawlerResult.average < costObj.alumRange1){
                                                            var tempDivisor1 = parseInt((costObj.alumRange1 - crawlerResult.average) / costObj.alumPrice);
                                                            dj = dj + costObj.price - costObj.executePrice * tempDivisor1;
                                                        }
                                                        /*else if(crawlerResult.average > costObj.alumRange2 && crawlerResult.average < (costObj.alumRange2 + costObj.alumPrice) ){
                                                            dj = dj + costObj.price + costObj.executePrice;
                                                        }*/
                                                        else if(crawlerResult.average > costObj.alumRange2){
                                                            var tempDivisor2 = parseInt((crawlerResult.average - costObj.alumRange2) / costObj.alumPrice);
                                                            dj = dj + costObj.price + costObj.executePrice * tempDivisor2;
                                                        }

                                                        async.map(routings, function (rout, cb) {
                                                            if(rout != ''){
                                                                workCentreModel.findOne({code: rout} ,function (err, workCentre) {
                                                                    if (err) {
                                                                        return err(err);
                                                                    }
                                                                    else if(workCentre) {
                                                                        var jobName = workCentre.name;
                                                                        var jobId = workCentre._id;
                                                                        var price = workCentre.costPerHour/100;
                                                                        var jobNumber = workCentre.code;

                                                                        var routData = {
                                                                            jobName : jobName,
                                                                            jobId   : jobId,
                                                                            price   : price,
                                                                            jobNumber : jobNumber
                                                                        }

                                                                        cb(null, routData);

                                                                    }

                                                                });
                                                            }
                                                            else{
                                                                cb(null, false);
                                                            }

                                                        }, function (err, tempData) {
                                                            if (err) {
                                                                return next(err);
                                                            }

                                                            var tempRouting;

                                                            if(!tempData[0]){
                                                                tempRouting = [];
                                                            }
                                                            else{
                                                                tempRouting = tempData;
                                                            }             

                                                            var uId = req.session.uId;
                                                            var date = new Date();

                                                            var createdBy = {
                                                                user: uId,
                                                                date: date
                                                            };

                                                            var data = {
                                                                projectName  : projectId,
                                                                cgdh  : cgdh,
                                                                xh    : xh,
                                                                lbmc  : lbmc,
                                                                lbbh  : lbbh,
                                                                sfyx  : sfyx,
                                                                sqm   : sqm,
                                                                cjlhf : cjlhf,
                                                                szjys : szjys,
                                                                W     : W ? W : 0,
                                                                L1    : L1 ? L1 : 0,
                                                                L2    : L2 ? L2 : 0,
                                                                L3    : L3 ? L3 : 0,
                                                                L4    : L4 ? L4 : 0,
                                                                L5    : L5 ? L5 : 0,
                                                                L6    : L6 ? L6 : 0,
                                                                sl    : sl,
                                                                dw    : dw,
                                                                dj    : dj,
                                                                dkjjmj: dkjjmj,
                                                                zmj   : zmj,
                                                                boardType  : boardType,
                                                                jgsh  : jgsh,
                                                                jgth  : jgth,
                                                                createdBy  : createdBy,
                                                                comment    : comment ? comment : '',
                                                                ck    : ck ? ck : 0,
                                                                hf    : hf,
                                                                kc    : kc,
                                                                hfdj  : hfdj ? hfdj : 0,
                                                                kcdj  : kcdj ? hfdj : 0,
                                                                routing : tempRouting

                                                            }

                                                            var aluveneerOrders = new aluveneerOrdersModel(data);
                                                            aluveneerOrders.save(function(err, result){
                                                                if(err){
                                                                    return next(err);
                                                                }
                                                                tempCost(null);
                                                            })

                                                            tempResult.push(data);

                                                        });
                                                    }
                                                    else{
                                                        error = new Error('数据库中不存在当天铝锭价');
                                                        error.status = 400;
                                                        tempCost(error);
                                                    }                                                   

                                                });
                                               
                                            } else {
                                                error = new Error('不存在工程名称为: ' + projectName + '订单编号为: ' + cgdh + ' 的客户订单');
                                                error.status = 400;
                                                console.log(error);
                                                tempCost(error);
                                            }
                                        }
                                    });
                                });
                               
                            }
                            else
                            {
                                tempCost(null);
                            }
                        }, function(err){
                            if(err){
                                return tempList(err);
                            }

                            tempList(null);

                        });                                                

                    }
                    else
                    {
                        tempList(null);
                    }

                }, function(err){
                    if(err){
                        return asyncCb(err);
                    }
                    asyncCb(null);
                });

            }, function(err){
                if(err){
                    return callback(err);
                }
                callback(null);
            });           

        };

        async.waterfall([checkBuilding, checkAluOrders, getTotalPrice, checkProduct, checkAcreage, getTotal], function(err, excelResult){

            if(err){
                return next(err);
            }

            var response = {};

            if (err) {
                return next(err);
            }

            /*response.total = excelResult.length;*/
            response.data = excelResult;
           
            res.status(200).send(response);
        });

    }

    this.getBuildings = function (req, res, next) {
        var response = {};
        response.data = [];
        models.get(req.session.lastDb, 'buildingContract', buildingContractSchema).find({}, function (err, _buildingContract) {
            if (err) {
                return next(err);
            }

            response.data = _buildingContract;
            res.send(response);
        });
    };

    this.getNextRouting= function (nextRouting , req , callback) {
        var price;
        var dkjjmj;
        var nextRouting;
        var response = {};
        var aluId = nextRouting._id;
        var routingId = nextRouting.workCentre;
        var JobPositionSchema = models.get(req.session.lastDb, 'JobPosition', jobPositionSchema);
        var AluveneerOrdersSchema = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var workCentreSchema = models.get(req.session.lastDb, 'workCentre', workCentreSchema);

        AluveneerOrdersSchema.find({_id: aluId}, function (err, _aluveneerOrder) {
            if (err) {
                return next(err);
            }
            var flag = false;
            for(var i = 0; i < _aluveneerOrder[0].routing.length; i++){
                if(_aluveneerOrder[0].routing[i].jobId.toString() == routingId.toString()){
                    price = _aluveneerOrder[0].routing[i].price;
                    dkjjmj = _aluveneerOrder[0].dkjjmj;
                    flag = true;
                    if(i == _aluveneerOrder[0].routing.length-1){
                        nextRouting = null;
                        response = {
                            price:price,
                            nextRouting:nextRouting,
                            dkjjmj: dkjjmj
                        }
                    }else{
                        nextRouting = _aluveneerOrder[0].routing[i+1].jobId;
                        response = {
                            price:price,
                            nextRouting:nextRouting,
                            dkjjmj: dkjjmj
                        }
                    }

                }
            }
            if(!flag && !routingId){
                var l = aluveneerOrder[0].routing.length();
                price = _aluveneerOrder[0].routing[l].price;
                dkjjmj = _aluveneerOrder[0].dkjjmj;
                nextRouting = null;
                response = {
                    price:price,
                    nextRouting:nextRouting,
                    dkjjmj: dkjjmj
                }
            }
            callback(null, response);
        });
    };

    function getForm(req, res, next) {
        var AluveneerOrdersSchema = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        //var id = req.query.id.split('-');
        //var id = req.query.parrentContentId.split('-');
        var data = req.query;
        var sort = data.sort || {};
        var paginationObject = pageHelper(data);
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var keys;
        var parallelTasks;
        var filterObj = {};
        var optionsObject = [];
        var filter = data.filter || {};
        var id = filter.id.split('-');
        var contentType = data.contentType || 'aluveneerOrders';
        var filterMapper = new FilterMapper();

        if (filter) {
            filterObj = filterMapper.mapFilter(filter, contentType); // caseFilterOpp(filter);
        }

        optionsObject.push(filterObj);
        
        if (data.sort) {
            keys = Object.keys(data.sort)[0];
            req.query.sort[keys] = parseInt(data.sort[keys], 10);
            sort = data.sort;
        } else {
            sort = {'projectName': -1};
        }

        AluveneerOrdersSchema.aggregate([
            {
                $match: {
                    projectName: objectId(id[0]),
                    cgdh: id[1]
                }
            },
            {
                $lookup: {
                    from        : 'building',
                    localField  : 'projectName',
                    foreignField: '_id',
                    as          : 'projectName'
                }
            }, 
            {
                $project: {
                    projectName  : {$arrayElemAt: ['$projectName', 0]},
                    cgdh         : 1,
                    xh           : 1,
                    lbmc         : 1,
                    lbbh         : 1,
                    sfyx         : 1,
                    sqm          : 1,
                    cjlhf        : 1,
                    szjys        : 1,
                    W            : 1,
                    L1           : 1,
                    L2           : 1,
                    L3           : 1,
                    L4           : 1,
                    L5           : 1,
                    L6           : 1,
                    sl           : 1,
                    dw           : 1,
                    dkjjmj       : 1,
                    zmj          : 1,
                    jgsh         : 1,
                    jgth         : 1,
                    comment      : 1,
                    dj           : 1,
                    ck           : 1,
                    hf           : 1,
                    routing      : 1,
                    boardType    : 1,
                    priApproval  : 1,
                    location     : 1,
                    kc           : 1
                }
            }, 
            {
                $group: {
                    _id  : null,
                    total: {$sum: 1},
                    root : {$push: '$$ROOT'}
                }
            },
            {
                $unwind: '$root'
            },
            {
                $project: {
                    _id             : '$root._id',
                    projectName     : '$root.projectName',
                    cgdh            : '$root.cgdh',
                    xh              : '$root.xh',
                    lbmc            : '$root.lbmc',
                    lbbh            : '$root.lbbh',
                    sfyx            : '$root.sfyx',
                    sqm             : '$root.sqm',
                    cjlhf           : '$root.cjlhf',
                    szjys           : '$root.szjys',
                    W               : '$root.W',
                    L1              : '$root.L1',
                    L2              : '$root.L2',
                    L3              : '$root.L3',
                    L4              : '$root.L4',
                    L5              : '$root.L5',
                    L6              : '$root.L6',
                    sl              : '$root.sl',
                    dw              : '$root.dw',
                    dkjjmj          : '$root.dkjjmj',
                    zmj             : '$root.zmj',
                    jgsh            : '$root.jgsh',
                    jgth            : '$root.jgth',
                    comment         : '$root.comment',
                    dj              : '$root.dj',
                    ck              : '$root.ck',
                    hf              : '$root.hf',
                    routing         : '$root.routing',
                    boardType       : '$root.boardType',
                    priApproval     : '$root.priApproval',
                    location        : '$root.location',
                    kc              : '$root.kc',
                    total           : 1
                }
            },
            {
                $skip: skip
            }, 
            {
                $limit: limit
            }
            ],function (err, result) {
                var count;
                var response = {};
                
                if (err) {
                    return next(err);
                }

                count = result[0] && result[0].total ? result[0].total : 0;

                for(var i = 0; i < result.length; i++){
                    var temp = [];
                    var tempRouting = result[i].routing;

                    for(var j = 0; j < result[i].routing.length; j++){
                        temp.push(tempRouting[j].jobNumber);
                    }
                    result[i].routing = temp.join("-");
                    
                }

                response.total = count;
                response.data = result;

                res.status(200).send(response);
        });
    };


    this.importGraph = function (req, res, next) {
        var Model = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var id = req.params.id;
        var tempId = req.params.id.split('-');
        var projectName = tempId[0];
        var cgdh = tempId[1];

        var contentType = 'aluveneerOrders';
        var files = req.files && req.files.file ? req.files.file : null;
        var dir;
        var err;
        var location;

        contentType = contentType.toLowerCase();
        dir = path.join(contentType, id);

        var date = new Date();
        var uploadDate = date.getFullYear()*100000000+date.getMonth()*1000000+date.getDate()*10000+date.getHours()*100+date.getMinutes()+1000000;

        var tempArray = files.name.split('.');
        files.name = id + uploadDate.toString() + '.' + tempArray[1];
        location = 'uploads%2F'+contentType+'%2F'+id+'%2F'+files.name;

        if (!files) {
            err = new Error(RESPONSES.BAD_REQUEST);
            err.status = 400;

            return next(err);
        }

        uploader.postFile(dir, files, {userId: req.session.uName}, function (err, file) {

            if (err) {
                return next(err);
            }

            Model.update({projectName : projectName , cgdh : cgdh}, {$set: {location : location}}, {multi: true}, function(err, result) {

                if (err) {
                    return next(err);
                }

                res.status(200).send({success: 'aluveneerOrders updated success'});
            });

        });

    };

    this.getCurrentOrders = function (req, res, next){
        var retObj = {};
        var db = req.session.lastDb || 'saas'
        var produceScheduleModel = models.get(db, 'produceSchedule', produceScheduleSchema);
        var aluveneerOrderModel = models.get(db, 'aluveneerOrders', aluveneerOrdersSchema);

        function getProduceSchedule(cb){
            var now = new Date();
            var dateString = now.getFullYear()*10000 + now.getMonth()*100 + now.getDate() + 100;    
            dateString = dateString.toString();
            produceScheduleModel.aggregate([
                {
                    $match:{
                        scheduleDate: dateString
                    }
                },
                {
                    $project:{
                        projectId: 1,
                        orderNumber: 1
                    }
                }
            ],function(err, result){
                if(err){
                    return cb(err);
                }
                cb(null, result);
            });
        }

        function getOrder(produceSchedule, cb){
            async.map(produceSchedule, function(item, asyncCb){
                aluveneerOrderModel.aggregate([
                    {
                        $match: {
                            projectName: item.projectId,
                            cgdh: item.orderNumber
                        }
                    },
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
                            cgdh: 1,
                            projectName: {$arrayElemAt: ['$projectName', 0]}
                        }
                    },
                    {
                        $project: {
                            cgdh: 1,
                            'projectName._id': 1,
                            'projectName.name': 1
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
                orders = _.uniq(orders, 'cgdh');
                // var orderId = [];
                // orders.forEach(item => orderId.push(objectId(item._id)));
                cb(null, orders);
            })
        }

        async.waterfall([getProduceSchedule, getOrder], function(err, result){
            if(err){
                return next(err);
            }

            if(!result[0]){
                retObj.retStatus='Fail';
                retObj.retError='今日没有订单！';
                res.status(200).send(retObj);
            }
            else{
                retObj.retStatus='OK';
                retObj.retValue=result;
                res.status(200).send(retObj);
            }
        })
    };

    this.getById = function (req, res, next) {
        var response = {};
        response.data = [];
        models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema).find({}, function (err, result) {
            if (err) {
                return next(err);
            }

            response.data = result;
            res.send(response);
        });
    };

    this.getAluOrder = function(req, res, next){
        var db = req.session.lastDb;
        var aluveneerOrderModel = models.get(db, 'aluveneerOrders', aluveneerOrdersSchema);
        var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var barCodeModel = models.get(req.session.lastDb,'barCode',barCodeSchema);
        var orderModel = models.get(db, 'Order', orderSchema);
        var query = req.query;
        var id = query.id;

        function getAluorder(cb){
            orderModel.findById(id, function(err, orderItem){
                if(err){
                    next(err);
                }
                var building = orderItem.building;
                aluveneerOrderModel.aggregate([
                    {
                        $match: {
                            projectName: objectId(building),
                            priApproval: true
                        }
                    },
                    {
                        $project: {
                            id: '$_id',
                            projectName: 1,
                            text: '$cgdh'
                        }
                    }
                    ],function(err, result){
                        if(err){
                            cb(err)
                        }
                        if(result.length == 0){
                            var error = new Error('设计订单为空');
                            error.status = 400;
                            cb(error);
                        }
                        else{
                            var data = [];
                            for(var i=0; i<result.length; i++){
                                var flag = false;
                                if(!data.length){
                                    data.push(result[i]);
                                }
                                else{
                                    for(var j=0; j<data.length; j++){
                                        if(data[j].text == result[i].text){
                                            flag = true;
                                        }
                                    }
                                    if(!flag){
                                        data.push(result[i]);
                                    }
                                }
                            }
                            console.log(data);
                            cb(null, data);
                        }
                        
                })
            })
        }
        
        function getOrderRow(aluorder, cb){
            async.map(aluorder, function(item, asyncCb){
                var id = item.projectName.toString();
                var aluId = item.id;
                var cgdh = item.text;

                aluveneerOrderModel.find({cgdh: cgdh, projectName: id}, function(err, aluOrders){
                    if(err){
                        asyncCb(err)
                    }
                    async.map(aluOrders, function(aluOrder, asyncCb2){
                        var lbbh = aluOrder.lbbh;
                        OrderRows.aggregate([
                            {
                                $match: {
                                    description: aluOrder._id.toString()
                                }
                            },
                            {
                                $lookup: {
                                    from: 'Products',
                                    localField: 'product',
                                    foreignField: '_id',
                                    as: 'product'
                                }
                            },
                            {
                                $project: {
                                    id: '$_id',
                                    product: {$arrayElemAt: ['$product', 0]},
                                    description: 1
                                }
                            },
                            {
                                $project: {
                                    id: 1,
                                    text: {$concat: ['$product.name', ' ', lbbh]},
                                    description: 1,
                                    product: '$product._id'
                                }
                            }
                            ],function(err, result){
                                if(err){
                                    asyncCb2(err);
                                }

                                asyncCb2(null, result);
                        })
                    }, function(err, result){
                        if(err){
                            asyncCb(err)
                        }
                        result = _.flatten(result);
                        console.log(result);
                        var data = {
                            id: aluId,
                            text: cgdh,
                            children: result
                        }
                        asyncCb(null, data);
                    })
                })
                
            }, function(err, result){
                    if(err){
                        cb(err)
                    }
                    result = _.flatten(result);
                    if(result.length == 0){
                        var error = new Error('产品为空');
                        error.status = 400;
                        cb(error)
                    }
                    else{
                        cb(null, result)
                    }
                })
        }

        function getBarCode(infos, cb){
            async.map(infos, function(item, asyncCb3){
                var childs = item.children;
                async.map(childs, function(child, asyncCb4){
                    var description = child.description;
                    barCodeModel.aggregate([
                        {
                            $match: {
                                orderRowId: objectId(description),
                                status: 'New'
                            }
                        },
                        {
                            $lookup: {
                                from: 'workCentres',
                                localField: 'curWorkCentre',
                                foreignField: '_id',
                                as: 'curWorkCentre'
                            }
                        },
                        {
                            $project: {
                                curWorkCentre: {$arrayElemAt: ['$curWorkCentre', 0]},
                                text: '$barId',
                                id: '$_id'
                            }
                        },
                        {
                            $match: {
                                'curWorkCentre.code': '08'
                            }
                        }
                        ], function(err, result){
                        if(err){
                            asyncCb4(err);
                        }
                        child.children=result;
                        asyncCb4(null, child);
                    })

                }, function(err, result){
                    if(err){
                        asyncCb3(err)
                    }
                    result = _.flatten(result);
                    item.children = result;
                    asyncCb3(null, item);
                })
            }, function(err, result){
                if(err){
                    cb(err)
                }
                if(result.length == 0){
                    var error = new Error('条码为空');
                    error.status = 400;
                    cb(error);
                }
                cb(null, result);
            })
        }

	function removeEmpty(data, cb){
            data.forEach(function(item, index){
                if(!item.children.length){
                    delete data[index];
                }
                else{
                    item.children.forEach(function(orderRow, index2){
                        if(!orderRow.children.length){
                            delete item.children[index2];
                        }
                    })
                    item.children = _.compact(item.children);
                }
            })
            data.forEach(function(item, index){
                if(!item.children.length){
                    delete data[index];
                }
            })
            data = _.compact(data);
            cb(null, data)
        }

        async.waterfall([getAluorder, getOrderRow, getBarCode, removeEmpty], function(err, result){
            if(err){
                next(err)
            }
            res.status(200).send(result);
        })
    }

};

module.exports = Module;
