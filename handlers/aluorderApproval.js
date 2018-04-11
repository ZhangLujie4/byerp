var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
var buildingContractSchema = mongoose.Schemas.BuildingContract;
var opportunitiesSchema = mongoose.Schemas.Opportunitie;
var jobPositionSchema = mongoose.Schemas.JobPosition;
var barCodeSchema = mongoose.Schemas.barCode;
var countersSchema = mongoose.Schemas.Counter;
var workCentreSchema = mongoose.Schemas.workCentre;
var OrderSchema = mongoose.Schemas.Order;
var OrderRowsSchema = mongoose.Schemas.OrderRow;
var WorkflowSchema = mongoose.Schemas.workflow;
var ProductSchema = mongoose.Schemas.Products;
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
    var EAN13 = require('../helpers/ean13.js');


    this.createAluorderApproval = function (req, res, next) {
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

    this.aluorderApprovalUpdate = function (req, res, next) {
        var AluveneerOrdersSchema = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var WorkCentreSchema = models.get(req.session.lastDb, 'workCentre', workCentreSchema);
        var buildingContractSchema = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
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

        function getUnitPrice(tempData, callback){
            var unitPrice = [];
            AluveneerOrdersSchema.findOne({_id : _id}, function (err, alu) {

                if (err) {
                    console.log(err);
                } else {
                    if (alu) {
                        var projectId = alu.projectName;
                        var zmj = alu.zmj;

                        buildingContractSchema.findOne({projectName : projectId}, function (err, buiding) {

                            if (err) {
                                console.log(err);
                            } else {
                                if (buiding) {

                                    unitPrice.projectId = projectId;
                                    unitPrice.zmj = zmj;
                                    unitPrice.inventoryCost = buiding.inventory;
                                    unitPrice.aluminumCost = buiding.aluminum;
                                    callback(null, tempData, unitPrice);
                                   
                                } else {
                                    error = new Error('不存在工程名称为: ' + projectName + ' 的建材合同');
                                    error.status = 400;
                                    callback(error);
                                }
                            }
                        });

                    } else {
                        error = new Error('不存在该设计订单记录');
                        error.status = 400;
                        callback(error);
                    }
                }
            });

        };

        function getTotalPrice(tempData, unitPrice, callback){           
            var totalPrice;
            var hfdj;
            var kcdj;
            for(var i = 0; i < unitPrice.aluminumCost.length; i++){
                if(unitPrice.aluminumCost[i].items == '长距离焊缝')
                {
                    hfdj = unitPrice.aluminumCost[i].price;
                }
            }
            for(var i = 0; i < unitPrice.aluminumCost.length; i++){
                if(unitPrice.aluminumCost[i].items == '开槽')
                {
                    kcdj = unitPrice.aluminumCost[i].price;
                }
            }
            
            totalPrice = req.body.cjlhf*hfdj/500 + req.body.kc*kcdj + (parseInt(req.body.dj)+parseInt(req.body.ck))*unitPrice.zmj;
            callback(null, tempData, totalPrice);
        };

        function updateTotal(tempData, totalPrice, callback){
            var uId = req.session.uId;
            var date = new Date();

            data.editedBy = {
                user: uId,
                date: date
            }

            if(!tempData[0]){
                delete data.routing;
                data.priApproval = 'true';
            }
            else{
                data.routing = tempData;
                data.priApproval = 'true';
            }
            
            data.totalPrice = totalPrice;

            AluveneerOrdersSchema.findByIdAndUpdate(_id, data, {new: true},function (err, result1) {
                if (err) {
                    return next(err);
                }

                callback(null, result1);

            });

        };

        function createOrder(result1, callback){
            var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
            var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
            var Workflow = models.get(req.session.lastDb, 'workflow', WorkflowSchema);
            var Product = models.get(req.session.lastDb, 'Product', ProductSchema);

            Workflow.find({status : "New", wId : "Sales Order"})
                .exec(function (err, workflow) {
                    if (err) {
                        return next(err);
                    }

                    Order.find({building : result1.projectName, orderType : "salesOrder", externalId : result1.cgdh})
                        .exec(function (err, orderModel) {
                            if (err) {
                                return next(err);
                            }

                            if(orderModel.length){
                                Product.find({name : result1.lbmc}, function (err, mod) {
                                    if (err) {
                                        console.log(err);
                                    }

                                    if(mod){
                                        var parameters = [];
                                        parameters[0] = {};
                                        parameters[0].paraname = 'W(mm)';
                                        parameters[0].value = result1.W;
                                        parameters[1] = {};
                                        parameters[1].paraname = 'L1(mm)';
                                        parameters[1].value = result1.L1;
                                        parameters[2] = {};
                                        parameters[2].paraname = 'L2(mm)';
                                        parameters[2].value = result1.L2;
                                        parameters[3] = {};
                                        parameters[3].paraname = 'L3(mm)';
                                        parameters[3].value = result1.L3;
                                        parameters[4] = {};
                                        parameters[4].paraname = 'L4(mm)';
                                        parameters[4].value = result1.L4;
                                        parameters[5] = {};
                                        parameters[5].paraname = 'L5(mm)';
                                        parameters[5].value = result1.L5;
                                        parameters[6] = {};
                                        parameters[6].paraname = 'L6(mm)';
                                        parameters[6].value = result1.L6;
                                        var orderRowsData = {
                                            product    : mod[0]._id,
                                            quantity   : result1.sl,
                                            parameters : parameters,
                                            description : result1._id,
                                            unitPrice  : result1.dj,
                                            order      : orderModel[0]._id,
                                            UOM        : result1.dw
                                        }
                                        
                                        var orderRows = new OrderRows(orderRowsData);
                                        orderRows.save(function (err, orderRowResult) {
                                            if (err) {
                                                return next(err);
                                            }
                            
                                        });
                                    }
                                    else{
                                        console.log("材料基础库暂无此产品，请删除订单重新上传！");
                                    }
                                    
                                });   
                            }
                            else{
                                var orderData = {
                                    building : result1.projectName,
                                    externalId : result1.cgdh,
                                    workflow : workflow[0]._id,
                                }

                                orderData.createdBy = {};
                                orderData.createdBy.user = req.session.uId;
                                orderData.orderType = "salesOrder";

                                var order = new Order(orderData);
                                order.save(function (err, orderResult) {
                                    if (err) {
                                        return next(err);
                                    }

                                    Product.find({name : result1.lbmc}, function (err, mod) {
                                        if (err) {
                                            console.log(err);
                                        }

                                        if(mod){
                                            var parameters = [];
                                            parameters[0] = {};
                                            parameters[0].paraname = 'W(mm)';
                                            parameters[0].value = result1.W;
                                            parameters[1] = {};
                                            parameters[1].paraname = 'L1(mm)';
                                            parameters[1].value = result1.L1;
                                            parameters[2] = {};
                                            parameters[2].paraname = 'L2(mm)';
                                            parameters[2].value = result1.L2;
                                            parameters[3] = {};
                                            parameters[3].paraname = 'L3(mm)';
                                            parameters[3].value = result1.L3;
                                            parameters[4] = {};
                                            parameters[4].paraname = 'L4(mm)';
                                            parameters[4].value = result1.L4;
                                            parameters[5] = {};
                                            parameters[5].paraname = 'L5(mm)';
                                            parameters[5].value = result1.L5;
                                            parameters[6] = {};
                                            parameters[6].paraname = 'L6(mm)';
                                            parameters[6].value = result1.L6;
                                            var orderRowsData = {
                                                product    : mod[0]._id,
                                                quantity   : result1.sl,
                                                parameters : parameters,
                                                description : result1._id,
                                                unitPrice  : result1.dj,
                                                order      : orderResult._id,
                                                UOM        : result1.dw
                                            }
                                            
                                            var orderRows = new OrderRows(orderRowsData);
                                            orderRows.save(function (err, orderRowResult) {
                                                if (err) {
                                                    return next(err);
                                                }

                                                //event.emit('recalculateStatus', req, orderResult._id, next);
                                
                                            });
                                        }
                                        else{
                                            console.log("材料基础库暂无此产品，请删除订单重新上传！");
                                        }
                                        
                                    });                

                                });
                            }
                    });

            });

            callback(null, result1);
            
        }

        function createBarcodes(result1, callback){
            var barCodeModel = models.get(req.session.lastDb,'barCode',barCodeSchema);
            var counterModel = models.get(req.session.lastDb,'counters',countersSchema);
            var nowDate = new Date();     

            var i = 0;
            async.whilst(
                function(){
                    return i < result1.sl
                },
                function(cb){
                    var year = nowDate.getFullYear().toString().substr(2,2);
                    var month = nowDate.getMonth() + 1;
                    if(month<10){
                        month = '0' + month.toString()
                    }
                    else{
                        month = month.toString();
                    }

                    counterModel.findOne({name: 'barcodes'} ,function (err, counter) {
                        if (err) {
                            return callback(err);
                        }
                        else if(counter) {
                            var counterId = counter._id;
                            var newSeq = counter.seq + 1; 
                            counterModel.update({_id: counterId} , {seq : newSeq}, function (err, newCounter) {
                                
                                if (err) {
                                    return callback(err);
                                }
                                else if(newCounter) {
                                    var sequence = '';
                                    for(var j = 7; j > newSeq.toString().length; j--){
                                        sequence = sequence + '0';
                                    }
                                    sequence = sequence + newSeq.toString();
                                    var ean = new EAN13(1, year, month, sequence);

                                    var orderRowId = result1._id;
                                    //var currentRouting = result1.routing[0].jobId;
                                    var barCode = ean.code;
                                    var currentRouting;
                                    if(result1.routing.length > 0){
                                        currentRouting = result1.routing[0].jobId;
                                    }
                                    else{
                                        currentRouting = null;
                                    }

                                    var data = {
                                        orderRowId : orderRowId,
                                        curWorkCentre : currentRouting,
                                        barId : barCode
                                    }

                                    var model = new barCodeModel(data);
                                    model.save(function(err, barcodeResult){
                                        if(err){
                                            return cb(err);
                                        }
                                        i++;                 
                                        cb();
                                    });

                                }

                            });
                            
                        }

                    });

                },
                function(err){
                    if (err){
                        return callback(err);
                    }
                    var response = {success: '条码创建成功'};
                    callback(null, response);
                }
            );

        };

        async.waterfall([workCentreReplace, getUnitPrice, getTotalPrice, updateTotal, createOrder, createBarcodes], function(err, excelResult){

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
        var contentType = data.contentType || 'aluorderApproval';
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
            Model.findByIdAndUpdate(id, {priApproval : false}, function (err, aluveneerOrder) {
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

        models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema).findByIdAndRemove(_id, function (err, aluveneerOrder) {
            if (err) {
                return next(err);
            }

            res.send(200, {success: 'Success removed'});
        });
    };


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
        var contentType = data.contentType || 'aluorderApproval';
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
                    projectName     : '$root.projectName.name',
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

    this.aluorderApprovalCheck = function (req, res, next) {
        var AluveneerOrdersSchema = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var WorkCentreSchema = models.get(req.session.lastDb, 'workCentre', workCentreSchema);
        var buildingContractSchema = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var body = req.body || {ids: []};
        var ids = body.ids;

        async.each(ids, function (id, cb) {
            AluveneerOrdersSchema.findOne({_id: id}, function (err, aluveneerOrder) {
                if (err) {
                    return err(err);
                }

                function workCentreReplace(callback){
                    var routings = [];
                    routings = aluveneerOrder.routing;

                    async.map(routings, function (rout, cb1) {
                        if(rout != ''){
                            rout = rout.jobNumber;
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

                                    cb1(null, data);

                                }

                            });
                        }
                        else{
                            cb1(null, false);
                        }

                    }, function (err, tempData) {
                        if (err) {
                            return next(err);
                        }                
                        callback(null, tempData);

                    });

                };

                function getUnitPrice(tempData, callback){
                    var unitPrice = [];
                    AluveneerOrdersSchema.findOne({_id : id}, function (err, alu) {

                        if (err) {
                            console.log(err);
                        } else {
                            if (alu) {
                                var projectId = alu.projectName;
                                var zmj = alu.zmj;
                                var cjlhf = alu.cjlhf;
                                var dj = alu.dj;
                                var ck = alu.ck;
                                var kc = alu.kc;

                                buildingContractSchema.findOne({projectName : projectId}, function (err, buiding) {

                                    if (err) {
                                        console.log(err);
                                    } else {
                                        if (buiding) {

                                            unitPrice.projectId = projectId;
                                            unitPrice.zmj = zmj;
                                            unitPrice.cjlhf = cjlhf;
                                            unitPrice.dj = dj;
                                            unitPrice.ck = ck;
                                            unitPrice.kc = kc;
                                            unitPrice.inventoryCost = buiding.inventory;
                                            unitPrice.aluminumCost = buiding.aluminum;
                                            callback(null, tempData, unitPrice);
                                           
                                        } else {
                                            error = new Error('不存在工程名称为: ' + projectName + ' 的建材合同');
                                            error.status = 400;
                                            callback(error);
                                        }
                                    }
                                });

                            } else {
                                error = new Error('不存在该设计订单记录');
                                error.status = 400;
                                callback(error);
                            }
                        }
                    });

                };

                function getTotalPrice(tempData, unitPrice, callback){           
                    var totalPrice;
                    var hfdj;
                    var kcdj;
                    for(var i = 0; i < unitPrice.aluminumCost.length; i++){
                        if(unitPrice.aluminumCost[i].items == '长距离焊缝')
                        {
                            hfdj = unitPrice.aluminumCost[i].price;
                        }
                    }
                    for(var i = 0; i < unitPrice.aluminumCost.length; i++){
                        if(unitPrice.aluminumCost[i].items == '开槽')
                        {
                            kcdj = unitPrice.aluminumCost[i].price;
                        }
                    }
                    console.log(unitPrice);
                    
                    totalPrice = unitPrice.cjlhf*hfdj/500 + unitPrice.kc*kcdj + (unitPrice.dj+unitPrice.ck)*unitPrice.zmj;
                    console.log(totalPrice);
                    callback(null, tempData, totalPrice);
                };

                function updateTotal(tempData, totalPrice, callback){
                    var uId = req.session.uId;
                    var date = new Date();

                    aluveneerOrder.editedBy = {
                        user: uId,
                        date: date
                    }

                    if(!tempData[0]){
                        delete aluveneerOrder.routing;
                        aluveneerOrder.priApproval = 'true';
                    }
                    else{
                        aluveneerOrder.routing = tempData;
                        aluveneerOrder.priApproval = 'true';
                    }
                    
                    aluveneerOrder.totalPrice = totalPrice;

                    AluveneerOrdersSchema.findByIdAndUpdate(id, aluveneerOrder, function (err, result1) {
                        if (err) {
                            return next(err);
                        }

                        callback(null, result1);

                    });

                };

                function createOrder(result1, callback){
                    var Order = models.get(req.session.lastDb, 'Order', OrderSchema);
                    var OrderRows = models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
                    var Workflow = models.get(req.session.lastDb, 'workflow', WorkflowSchema);
                    var Product = models.get(req.session.lastDb, 'Product', ProductSchema);

                    Workflow.find({status : "New", wId : "Sales Order"})
                        .exec(function (err, workflow) {
                            if (err) {
                                return next(err);
                            }

                            Order.find({project : result1.projectName, orderType : "salesOrder", externalId : cgdh})
                                .exec(function (err, orderModel) {
                                    if (err) {
                                        return next(err);
                                    }

                                    if(orderModel.length){
                                        Product.find({name : result1.lbmc}, function (err, mod) {
                                            if (err) {
                                                console.log(err);
                                            }

                                            if(mod){
                                                var parameters = [];
                                                parameters[0] = {};
                                                parameters[0].paraname = 'W(mm)';
                                                parameters[0].value = result1.W;
                                                parameters[1] = {};
                                                parameters[1].paraname = 'L1(mm)';
                                                parameters[1].value = result1.L1;
                                                parameters[2] = {};
                                                parameters[2].paraname = 'L2(mm)';
                                                parameters[2].value = result1.L2;
                                                parameters[3] = {};
                                                parameters[3].paraname = 'L3(mm)';
                                                parameters[3].value = result1.L3;
                                                parameters[4] = {};
                                                parameters[4].paraname = 'L4(mm)';
                                                parameters[4].value = result1.L4;
                                                parameters[5] = {};
                                                parameters[5].paraname = 'L5(mm)';
                                                parameters[5].value = result1.L5;
                                                parameters[6] = {};
                                                parameters[6].paraname = 'L6(mm)';
                                                parameters[6].value = result1.L6;
                                                var orderRowsData = {
                                                    product    : mod[0]._id,
                                                    quantity   : result1.sl,
                                                    parameters : parameters,
                                                    description : result1._id,
                                                    unitPrice  : result1.dj,
                                                    order      : orderModel[0]._id,
                                                    UOM        : result1.dw
                                                }
                                                
                                                var orderRows = new OrderRows(orderRowsData);
                                                orderRows.save(function (err, orderRowResult) {
                                                    if (err) {
                                                        return next(err);
                                                    }
                                    
                                                });
                                            }
                                            else{
                                                console.log("材料基础库暂无此产品，请删除订单重新上传！");
                                            }
                                            
                                        });   
                                    }
                                    else{
                                        var orderData = {
                                            project : result1.projectName,
                                            externalId : result1.cgdh,
                                            workflow : workflow[0]._id,
                                        }

                                        orderData.createdBy = {};
                                        orderData.createdBy.user = req.session.uId;
                                        orderData.orderType = "salesOrder";

                                        var order = new Order(orderData);
                                        order.save(function (err, orderResult) {
                                            if (err) {
                                                return next(err);
                                            }

                                            Product.find({name : result1.lbmc}, function (err, mod) {
                                                if (err) {
                                                    console.log(err);
                                                }

                                                if(mod){
                                                    var parameters = [];
                                                    parameters[0] = {};
                                                    parameters[0].paraname = 'W(mm)';
                                                    parameters[0].value = result1.W;
                                                    parameters[1] = {};
                                                    parameters[1].paraname = 'L1(mm)';
                                                    parameters[1].value = result1.L1;
                                                    parameters[2] = {};
                                                    parameters[2].paraname = 'L2(mm)';
                                                    parameters[2].value = result1.L2;
                                                    parameters[3] = {};
                                                    parameters[3].paraname = 'L3(mm)';
                                                    parameters[3].value = result1.L3;
                                                    parameters[4] = {};
                                                    parameters[4].paraname = 'L4(mm)';
                                                    parameters[4].value = result1.L4;
                                                    parameters[5] = {};
                                                    parameters[5].paraname = 'L5(mm)';
                                                    parameters[5].value = result1.L5;
                                                    parameters[6] = {};
                                                    parameters[6].paraname = 'L6(mm)';
                                                    parameters[6].value = result1.L6;
                                                    var orderRowsData = {
                                                        product    : mod[0]._id,
                                                        quantity   : result1.sl,
                                                        parameters : parameters,
                                                        description : result1._id,
                                                        unitPrice  : result1.dj,
                                                        order      : orderResult._id,
                                                        UOM        : result1.dw
                                                    }
                                                    
                                                    var orderRows = new OrderRows(orderRowsData);
                                                    orderRows.save(function (err, orderRowResult) {
                                                        if (err) {
                                                            return next(err);
                                                        }

                                                        //event.emit('recalculateStatus', req, orderResult._id, next);
                                        
                                                    });
                                                }
                                                else{
                                                    console.log("材料基础库暂无此产品，请删除订单重新上传！");
                                                }
                                                
                                            });                

                                        });
                                    }
                            });

                    });

                    callback(null, result1);
                    
                }

                function createBarcodes(result1, callback){
                    var barCodeModel = models.get(req.session.lastDb,'barCode',barCodeSchema);
                    var counterModel = models.get(req.session.lastDb,'counters',countersSchema);
                    var nowDate = new Date();     

                    var i = 0;
                    async.whilst(
                        function(){
                            return i < result1.sl
                        },
                        function(cb){
                            var year = nowDate.getFullYear().toString().substr(2,2);
                            var month = nowDate.getMonth() + 1;
                            if(month<10){
                                month = '0' + month.toString()
                            }
                            else{
                                month = month.toString();
                            }

                            counterModel.findOne({name: 'barcodes'} ,function (err, counter) {
                                if (err) {
                                    return callback(err);
                                }
                                else if(counter) {
                                    var counterId = counter._id;
                                    var newSeq = counter.seq + 1; 
                                    counterModel.update({_id: counterId} , {seq : newSeq}, function (err, newCounter) {
                                        
                                        if (err) {
                                            return callback(err);
                                        }
                                        else if(newCounter) {
                                            var sequence = '';
                                            for(var j = 7; j > newSeq.toString().length; j--){
                                                sequence = sequence + '0';
                                            }
                                            sequence = sequence + newSeq.toString();
                                            var ean = new EAN13(1, year, month, sequence);

                                            var orderRowId = result1._id;
                                            //var currentRouting = result1.routing[0].jobId;
                                            var barCode = ean.code;
                                            var currentRouting;
                                            if(result1.routing.length > 0){
                                                currentRouting = result1.routing[0].jobId;
                                            }
                                            else{
                                                currentRouting = null;
                                            }

                                            var data = {
                                                orderRowId : orderRowId,
                                                curWorkCentre : currentRouting,
                                                barId : barCode
                                            }

                                            var model = new barCodeModel(data);
                                            model.save(function(err, barcodeResult){
                                                if(err){
                                                    return cb(err);
                                                }
                                                i++;                 
                                                cb();
                                            });

                                        }

                                    });
                                    
                                }

                            });

                        },
                        function(err){
                            if (err){
                                return callback(err);
                            }
                            var response = {success: '条码创建成功'};
                            callback(null, response);
                        }
                    );

                };

                async.waterfall([workCentreReplace, getUnitPrice, getTotalPrice, updateTotal, createOrder, createBarcodes], function(err, excelResult){

                    if(err){
                        return next(err);
                    }

                    var response = {};

                    if (err) {
                        return next(err);
                    }

                    response.data = excelResult;

                });

                cb();
            });

        }, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: true});
        });
    };

};

module.exports = Module;
