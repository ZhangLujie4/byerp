var mongoose = require('mongoose');
var buildingSchema = mongoose.Schemas.Building;
var aluveneerOrdersSchema = mongoose.Schemas.AluveneerOrder;
var barCodeSchema = mongoose.Schemas.barCode;
var plantWorkGroupSchema = mongoose.Schemas.plantWorkGroup;
var OrderRowsSchema = mongoose.Schemas.OrderRow;
var GoodsOutSchema = mongoose.Schemas.GoodsOutNote;
var OrderSchema = mongoose.Schemas.Order;
var journalEntrySchema = mongoose.Schemas.journalEntry;
var journalSchema = mongoose.Schemas.journal;
var goodsPlanSchema=mongoose.Schemas.goodsPlan;
var workCentreSchema = mongoose.Schemas.workCentre;
var scanlogSchema = mongoose.Schemas.scanlog;
var objectId = mongoose.Types.ObjectId;
var chartOfAccountSchema = mongoose.Schemas.chartOfAccount;
var materialProcessOutputSchema= mongoose.Schemas.materialProcessOutput;
var oemOrdersSchema = mongoose.Schemas.oemOrders;
var goodsInNoteSchema=mongoose.Schemas.GoodsInNote;
var shippingNoteSchema = mongoose.Schemas.shippingNote;

var _ = require('underscore');
var async = require('async');
var moment = require('../public/js/libs/moment/moment');
var pageHelper = require('../helpers/pageHelper');
var FilterMapper = require('../helpers/filterMapper');
var filterMapper = new FilterMapper();
var CONSTANTS = require('../constants/mainConstants.js');

var Module = function (models, event) {
    'use strict';


    function getOutputByBuildingAndDate(req,mainCallback,id,next) {
        var AluveneerOrders = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var scanlog = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var BarCode = models.get(req.session.lastDb, 'barCode', barCodeSchema);
        var building=models.get(req.session.lastDb,'building',buildingSchema);
        var materialProcessOutput=models.get(req.session.lastDb,'materialProcessOutput',materialProcessOutputSchema);
        var oemOrders = models.get(req.session.lastDb, 'oemOrders', oemOrdersSchema);
        var goodsInNote=models.get(req.session.lastDb, 'GoodsInNote', goodsInNoteSchema);
        var OrderRows=models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);

        var data = req.query;
        var contentType = data.contentType || 'costApportionment';
        var filter = data.filter || {};
        var buildingId=id || null;
        var filterMapper = new FilterMapper();
        var scanFilter={};
        var filterObjScanDate={};
        var dateFilter={};
        var filterObjDate={};
        var parallel;
        var startDate = moment(new Date()).startOf('month');
        startDate=new Date(startDate);
        var endDate =new Date() ;
        scanFilter.scantime=filter.date ||{value:[startDate,endDate]};
        if(scanFilter.scantime) {
            filterObjScanDate = filterMapper.mapFilter(scanFilter, {
                contentType: contentType,
                keysArray: ['scantime']
            });

        }
        dateFilter.date=filter.date ||{value:[startDate,endDate]};
        if(dateFilter.date) {
            filterObjDate = filterMapper.mapFilter(dateFilter, {
                contentType: contentType,
                keysArray: ['date']
            });

        }

        function aluOrderOutput(aluCb) {
            var data={};
            var metalPlateArea=0;
            var sprayArea=0;
            var aluList=[];
            var sprayList=[];
            AluveneerOrders
                .aggregate([
                    {
                        $match: {
                            projectName: objectId(buildingId)
                        }
                    },
                    {
                        $project: {
                            _id : 1,
                            cgdh: 1,
                            lbmc: 1,
                            lbbh: 1,
                            sl  : 1,
                            dw  : 1,
                            zmj : 1,
                            comment: 1,
                            'createdBy.date':1
                        }
                    }
                ], function (err, result) {
                    if(err){
                        next(err)
                    }
                    if (result.length) {
                        async.each(result, function (resultObj, asyncCb) {
                            var aluId = resultObj._id;
                            aluId = aluId.toString();
                            BarCode
                                .aggregate([
                                    {
                                        $match: {
                                            orderRowId: objectId(aluId)
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1
                                        }
                                    }
                                ], function (err2, BarCodeResult) {


                                    async.each(BarCodeResult,function (BarCodeObj,BarCodeCb) {
                                        var BarCodeId=BarCodeObj._id;
                                        scanlog
                                            .aggregate([
                                                {
                                                    $match:{
                                                        barCode:objectId(BarCodeId)
                                                    }
                                                },
                                                {
                                                    $match: filterObjScanDate
                                                },
                                                {
                                                    $lookup: {
                                                        from: 'workCentres',
                                                        localField: 'workCentre',
                                                        foreignField: '_id',
                                                        as: 'workCentre'
                                                    }
                                                },
                                                {
                                                    $project: {
                                                        workCentre        : {$arrayElemAt: ['$workCentre', 0]},
                                                        area              : 1
                                                    }
                                                }
                                            ],function (err,scanlogResult) {
                                                async.each(scanlogResult,function (scanlogObj,scanlogCb) {
                                                    if(scanlogObj.workCentre.code==CONSTANTS.METALWORKCODE){
                                                        metalPlateArea=metalPlateArea+scanlogObj.area;
                                                        var thisOutput={};
                                                        thisOutput.order=resultObj;
                                                        thisOutput.output=scanlogObj.area;
                                                        aluList.push(thisOutput);
                                                        scanlogCb(null)
                                                    }else if(scanlogObj.workCentre.code==CONSTANTS.SPRAYWORKCODE){
                                                        sprayArea=sprayArea+scanlogObj.area;
                                                        var thisOutputs={};
                                                        thisOutputs.order=resultObj;
                                                        thisOutputs.output=scanlogObj.area;
                                                        sprayList.push(thisOutputs);
                                                        scanlogCb(null)
                                                    }else{
                                                        scanlogCb(null)
                                                    }
                                                },function () {
                                                    BarCodeCb(null)
                                                })
                                            })
                                    },function () {
                                        asyncCb(null)
                                    });

                                });
                        }, function () {
                            if (err) {
                                return next(err);
                            }

                            data.metalPlateArea=metalPlateArea;
                            data.sprayArea=sprayArea;
                            data.aluList=aluList;
                            data.sprayList=sprayList;
                            aluCb(null,data)

                        })
                    } else {

                        data.metalPlateArea=metalPlateArea;
                        data.sprayArea=sprayArea;
                        data.aluList=aluList;
                        data.sprayList=sprayList;
                        aluCb(null, data)
                    }

                })
        }
        
        function materialsProcessOutput(materialsCb) {
            var materialsOutput=0;
            var materialsList=[];

            oemOrders
                .aggregate([
                    {
                        $match:{
                            orderType:'oemOrders',
                            building:objectId(buildingId)
                        }
                    },
                    {
                        $project:{
                            _id:1
                        }
                    }
                ],function (err,oemOrdersResult) {
                    if(err){
                        next(err)
                    }
                    async.each(oemOrdersResult,function (oemObj,oemCb) {
                        var orderId=oemObj._id;
                        goodsInNote
                            .aggregate([
                                {
                                    $match:filterObjDate
                                },
                                {
                                    $match:{
                                        order:objectId(orderId),
                                        reason: 'FI'
                                    }
                                },
                                {
                                    $project:{
                                        _id        : 1,
                                        orderRows  : 1
                                    }
                                }
                            ],function (err,goodsInNoteResult) {
                                async.each(goodsInNoteResult,function (goodsInNoteObj,goodsInNoteCb) {
                                    async.each(goodsInNoteObj.orderRows,function (orderRowsObj,orderRowsCb) {
                                        OrderRows
                                            .aggregate([
                                                {
                                                    $match:{
                                                        _id:objectId(orderRowsObj.orderRowId)
                                                    }
                                                },
                                                {
                                                    $lookup: {
                                                        from        : 'Order',
                                                        localField  : 'order',
                                                        foreignField: '_id',
                                                        as          : 'order'
                                                    }
                                                },
                                                {
                                                    $lookup: {
                                                        from        : 'Products',
                                                        localField  : 'product',
                                                        foreignField: '_id',
                                                        as          : 'product'
                                                    }
                                                },
                                                {
                                                    $project:{
                                                        _id:1,
                                                        order:{$arrayElemAt: ['$order', 0]},
                                                        quantity:1,
                                                        unitPrice:1,
                                                        priceQty:1,
                                                        product:{$arrayElemAt: ['$product', 0]}
                                                    }
                                                }
                                            ],function (err,orderRowResult) {
                                                if(err){
                                                    next(err)
                                                }
                                                if(orderRowResult.length) {
                                                    materialsOutput = materialsOutput + orderRowsObj.quantity * (orderRowResult[0].priceQty/orderRowResult[0].quantity);
                                                    var thisMaterialsOutput = {};
                                                    thisMaterialsOutput.output = orderRowsObj.quantity * (orderRowResult[0].priceQty/orderRowResult[0].quantity);
                                                    thisMaterialsOutput.quantity=orderRowsObj.quantity;
                                                    thisMaterialsOutput.order = orderRowResult[0];
                                                    materialsList.push(thisMaterialsOutput)
                                                }
                                                orderRowsCb(null)
                                            })

                                    },function () {
                                        goodsInNoteCb(null)
                                    })

                                },function () {
                                    oemCb(null);
                                })
                            })
                    },function () {
                        materialsCb(null,{materialsOutput:materialsOutput,materialsList:materialsList})
                    })
                })


        }

        parallel=[aluOrderOutput,materialsProcessOutput];
        async.parallel(parallel, function (err, result) {
            var aluOrder=result[0];
            var materials=result[1];
            var totalMetalPlateArea;
            var totalSparyArea;
            var data={};
            totalMetalPlateArea=aluOrder.metalPlateArea;
            totalSparyArea=aluOrder.sprayArea+materials.materialsOutput;
            data.totalMetalPlateArea=totalMetalPlateArea;
            data.totalsparyArea=totalSparyArea;
            data.date=scanFilter.scantime;
            data.aluList=aluOrder.aluList;
            data.sprayList=aluOrder.sprayList;
            data.materialsList=materials.materialsList;

            building
                .aggregate([
                    {
                        $match:{
                            _id:objectId(buildingId)
                        }
                    },
                    {
                        $project:{
                            _id:1,
                            name:1
                        }
                    }
                ],function (err,buildingResult) {
                    data.building=buildingResult[0];
                    mainCallback(null,data)
                });

        })
    }

    function getRawMaterialCosting (req,mainCallback,id,next) {
        var Order=models.get(req.session.lastDb, 'Order', OrderSchema);
        var OrderRows=models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var GoodsOutNote=models.get(req.session.lastDb,'GoodsOutNote',GoodsOutSchema);
        var goodsInNote=models.get(req.session.lastDb, 'GoodsInNote', goodsInNoteSchema);
        var data = req.query;
        var contentType = data.contentType || 'costApportionment';
        var filter = data.filter || {};
        var buildingId=id || null;
        var filterMapper = new FilterMapper();
        var CreationDate={};
        var filterObjCreationDate={};
        var startDate = moment(new Date()).startOf('month');
        startDate=new Date(startDate);
        var endDate =new Date() ;
        CreationDate.date=filter.date ||{value:[startDate,endDate]};

        if(CreationDate.date) {
            filterObjCreationDate = filterMapper.mapFilter(CreationDate, {
                contentType: contentType,
                keysArray: ['date']
            });
        }

        var rawMaterialCosting=0;
        Order
            .aggregate([
                {
                    $match: {
                        orderType: 'goodsPlan'
                    }
                },
                {
                    $match: {
                        building: objectId(buildingId)
                    }
                },
                {
                    $lookup: {
                        from: 'building',
                        localField: 'building',
                        foreignField: '_id',
                        as: 'building'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        building: {$arrayElemAt: ['$building', 0]},
                        name:1
                    }
                }
            ], function (err, OrderResult) {
                if(err){
                    next(err)
                }
                var goodsOutNoteList=[];
                async.each(OrderResult, function (OrderObj, OrderCb) {
                    var planId = OrderObj._id;
                    var goodsPlanCost=0;
                    GoodsOutNote
                        .aggregate([
                            {
                              $match:filterObjCreationDate
                            },
                            {
                                $match:{
                                    order:objectId(planId)

                                }
                            },
                            {
                                $project:{
                                    orderRows:1,
                                    date:1,
                                    name:1,
                                    _id:1
                                }
                            },
                            {
                                $unwind: '$orderRows'
                            },
                            {
                                $lookup: {
                                    from        : 'Products',
                                    localField  : 'orderRows.product',
                                    foreignField: '_id',
                                    as          : 'orderRows.product'
                                }
                            },
                            {
                                $project:{
                                    orderRows:1,
                                    'orderRows.product': {$arrayElemAt: ['$orderRows.product', 0]},
                                    date:1,
                                    name:1,
                                    _id:1
                                }
                            },
                            {
                                $group: {
                                    _id              : '$_id',
                                    name             : {$first: '$name'},
                                    date             : {$first: '$date'},
                                    orderRows        : {$push:'$aluOrder'}
                                }
                            }

                        ],function (err,OutNoteResult) {
                            async.each(OutNoteResult,function (outNoteObj,outNoteCb) {
                                var orderRowsList=outNoteObj.orderRows;
                                var goodsOutNoteCost=0;
                                var RowsList=[];
                                async.each(orderRowsList,function (orderRowsObj,orderRowsCb) {
                                    var quantity=orderRowsObj.quantity;
                                    var cost=orderRowsObj.cost ||0;
                                    rawMaterialCosting = rawMaterialCosting + cost;
                                    goodsOutNoteCost = goodsOutNoteCost + cost;
                                    RowsList.push({
                                        product: orderRowsObj.product.name,
                                        quantity: quantity,
                                        total: cost
                                    });
                                    orderRowsCb(null)
                                },function (err) {
                                    if(err){
                                        next(err)
                                    }
                                    goodsOutNoteList.push({goodsOutNoteCost:goodsOutNoteCost,details:RowsList,noteName:outNoteObj.name,date:outNoteObj.date});
                                    outNoteCb(null)
                                })
                            },function (err) {
                                if(err){
                                    next(err)
                                }
                                OrderCb(null)
                            })
                        })
                },function (err) {
                    if(err){
                        next(err)
                    }
                    mainCallback(null,{rawMaterialCosting:rawMaterialCosting,orderRowList:goodsOutNoteList});
                })
            })

    }

    function getShippingCosting(req,mainCallback,id,next) {
        var orderModel=models.get(req.session.lastDb,'Order', OrderSchema);
        var GoodsOutNote=models.get(req.session.lastDb,'GoodsOutNote',GoodsOutSchema);
        var shippingNote = models.get(req.session.lastDb, 'shippingNote', shippingNoteSchema);
        var dateFilter={};
        var data = req.query;
        var filter = data.filter || {};
        var contentType = data.contentType || 'costApportionment';
        var filterObjDate={};
        var startDate = moment(new Date()).startOf('month');
        startDate=new Date(startDate);
        var endDate =new Date() ;
        dateFilter.date=filter.date ||{value:[startDate,endDate]};
        if(dateFilter.date) {
            filterObjDate = filterMapper.mapFilter(dateFilter, {
                contentType: contentType,
                keysArray: ['date']
            });
        }


        orderModel
            .aggregate([
                {
                    $match:{
                        orderType:'salesOrder',
                        building:objectId(id)
                    }
                },
                {
                    $project:{
                        _id:1
                    }

                }
            ],function (err,orderResult) {
                if(err){
                    next(err)
                }
                var shippingNoteList=[];
                var totalFee=0;
                var totalArea=0;
                var totalSale=0;
                async.each(orderResult,function (orderObj,orderCb) {
                    var orderId=orderObj._id;
                    GoodsOutNote
                        .aggregate([
                            {
                                $match:filterObjDate
                            },
                            {
                                $match:{
                                    order:objectId(orderId)
                                }
                            },
                            {
                                $project:{
                                    _id:1
                                }
                            }
                        ],function (err,outNoteResult) {
                            if(err){
                                next(err)
                            }
                            async.each(outNoteResult,function (NoteObj,NoteCb) {
                                var totalNoteFee=0;
                                var totalNoteArea=0;
                                var totalNoteSale=0;
                                var NoteList=[];
                                var NoteId=NoteObj._id;
                                shippingNote
                                    .aggregate([
                                        {
                                            $match:{
                                                goodsOutNote:objectId(NoteId),
                                                status:'Done'
                                            }
                                        },
                                        {
                                           $project: {
                                               _id       : 1,
                                               ID        : 1,
                                               shipDate  : 1,
                                               barCodes  : 1,
                                               fee       : 1,
                                               fee1      : 1,
                                               isReturn  : 1,
                                               area      : 1,
                                               price     : 1
                                           }
                                        },
                                        {
                                            $unwind: '$barCodes'
                                        },
                                        {
                                            $lookup: {
                                                from: 'barCode',
                                                localField: 'barCodes',
                                                foreignField: '_id',
                                                as: 'barCodes'
                                            }
                                        },
                                        {
                                            $project: {
                                                _id       : 1,
                                                ID        : 1,
                                                shipDate  : 1,
                                                barCodes  : {$arrayElemAt: ['$barCodes', 0]},
                                                fee       : 1,
                                                fee1      : 1,
                                                isReturn  : 1,
                                                area      : 1,
                                                price     : 1
                                            }
                                        },
                                        {
                                           $project: {
                                               _id                  : 1,
                                               ID                   : 1,
                                               shipDate             : 1,
                                               'barCodes._id'       : '$barCodes._id',
                                               'barCodes.orderRowId': '$barCodes.orderRowId',
                                               fee                  : 1,
                                               fee1                 : 1,
                                               isReturn             : 1,
                                               area                 : 1,
                                               price                : 1
                                           }
                                        },
                                        {
                                            $lookup: {
                                                from: 'aluveneerOrders',
                                                localField: 'barCodes.orderRowId',
                                                foreignField: '_id',
                                                as: 'barCodes.orderRowId'
                                            }
                                        },
                                        {
                                            $project: {
                                                _id                  : 1,
                                                ID                   : 1,
                                                shipDate             : 1,
                                                'barCodes._id'       : '$barCodes._id',
                                                'barCodes.orderRowId': '$barCodes.orderRowId',
                                                fee                  : 1,
                                                fee1                 : 1,
                                                aluOrder             : {$arrayElemAt: ['$barCodes.orderRowId', 0]},
                                                isReturn             : 1,
                                                area                 : 1,
                                                price                : 1
                                            }
                                        },
                                        {
                                            $group: {
                                                _id              : '$_id',
                                                ID               : {$first: '$ID'},
                                                shipDate         : {$first: '$shipDate'},
                                                fee              : {$first: '$fee'},
                                                fee1             : {$first: '$fee1'},
                                                isReturn         : {$first: '$isReturn'},
                                                area             : {$first: '$area'},
                                                price            : {$first: '$price'},
                                                details          : {$push:'$aluOrder'}
                                            }
                                        }
                                    ],function (err,shippingResult) {
                                        async.each(shippingResult,function (shippingObj,shippingCb) {
                                            if(!shippingObj.isReturn) {
                                                totalNoteFee = shippingObj.fee - shippingObj.fee1;
                                                totalNoteArea = shippingObj.area;
                                                totalNoteSale=totalNoteSale+shippingObj.price+shippingObj.fee1;
                                                NoteList=shippingObj.details;
                                                shippingNoteList.push({_id:shippingObj._id,name:shippingObj.ID,date:shippingObj.shipDate,totalNoteFee:totalNoteFee,totalNoteArea:totalNoteArea,totalNoteSale:totalNoteSale,details:NoteList})
                                            }else{

                                            }
                                            shippingCb(null)
                                        },function (err) {
                                            if(err){
                                                next(err)
                                            }
                                            if(totalNoteFee){
                                                totalFee=totalFee+totalNoteFee;
                                                totalArea=totalArea+totalNoteArea;
                                                totalSale=totalSale+totalNoteSale;
                                            }
                                            NoteCb(null)
                                        })
                                    })
                            },function (err) {
                                if(err){
                                    next(err)
                                }
                                orderCb(null)
                            })
                        })
                },function (err) {
                    if(err){
                        next(err)
                    }
                    mainCallback(null,{totalFee:totalFee,totalArea:totalArea,totalSale:totalSale,details:shippingNoteList});
                })
            })
    }

    function getProcessingCost (req,mainCallback,id,next) {
        var AluveneerOrders = models.get(req.session.lastDb, 'aluveneerOrders', aluveneerOrdersSchema);
        var scanlog = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var BarCode = models.get(req.session.lastDb, 'barCode', barCodeSchema);
        var data = req.query;
        var contentType = data.contentType || 'costApportionment';
        var filter = data.filter || {};
        var buildingId=id || null;
        var filterMapper = new FilterMapper();
        var scanFilter={};
        var filterObjScanDate={};
        var startDate = moment(new Date()).startOf('month');
        startDate=new Date(startDate);
        var endDate =new Date() ;
        scanFilter.scantime=filter.date ||{value:[startDate,endDate]};
        if(scanFilter.scantime) {
            filterObjScanDate = filterMapper.mapFilter(scanFilter, {
                contentType: contentType,
                keysArray: ['scantime']
            });
        }

        var processingCost=0;
        var scanList=[];
        AluveneerOrders
            .aggregate([
                {
                    $match: {
                        projectName: objectId(buildingId)
                    }
                },
                {
                    $project: {
                        _id : 1
                    }
                }
            ], function (err, result) {
                if(err){
                    next(err)
                }
                if (result.length) {
                    async.each(result, function (resultObj, asyncCb) {
                        var aluId = resultObj._id;
                        aluId = aluId.toString();
                        BarCode
                            .aggregate([
                                {
                                    $match: {
                                        orderRowId: objectId(aluId)
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1
                                    }
                                }
                            ], function (err2, BarCodeResult) {
                                async.each(BarCodeResult,function (BarCodeObj,BarCodeCb) {
                                    var BarCodeId=BarCodeObj._id;
                                    scanlog
                                        .aggregate([
                                            {
                                                $match:{
                                                    barCode:objectId(BarCodeId)
                                                }
                                            },
                                            {
                                                $match: filterObjScanDate
                                            },
                                            {
                                                $lookup: {
                                                    from: 'barCode',
                                                    localField: 'barCode',
                                                    foreignField: '_id',
                                                    as: 'barCode'
                                                }
                                            },
                                            {
                                                $lookup: {
                                                    from: 'workCentres',
                                                    localField: 'workCentre',
                                                    foreignField: '_id',
                                                    as: 'workCentre'
                                                }
                                            },
                                            {
                                                $project: {
                                                    price             : 1,
                                                    barCode           :{$arrayElemAt: ['$barCode', 0]},
                                                    workCentre        : {$arrayElemAt: ['$workCentre', 0]},
                                                    scantime          : 1,
                                                    area              : 1
                                                }
                                            }
                                        ],function (err,scanlogResult) {
                                            async.each(scanlogResult,function (scanlogObj,scanlogCb) {
                                                processingCost=processingCost+scanlogObj.price;
                                                scanList.push(scanlogObj);
                                                scanlogCb(null)
                                            },function () {
                                                BarCodeCb(null)
                                            })
                                        })
                                },function () {
                                    asyncCb(null)
                                });


                            });
                    }, function () {
                        if (err) {
                            return next(err);
                        }
                        mainCallback(null,{processingCost:processingCost,scanList:scanList});

                    })
                } else {

                    mainCallback(null,{processingCost:processingCost,scanList:scanList});
                }

            })

    }

    function getPublicCosting (req,mainCallback,next) {
        var journalEntry = models.get(req.session.lastDb, 'journalEntry', journalEntrySchema);
        var chartOfAccount = models.get(req.session.lastDb, 'chartOfAccount', chartOfAccountSchema);
        var data = req.query;
        var contentType = data.contentType || 'costApportionment';
        var filter = data.filter || {};
        var filterMapper = new FilterMapper();
        var dateFilter={};
        var filterObjDate={};
        var startDate = moment(new Date()).startOf('month');
        startDate=new Date(startDate);
        var endDate =new Date() ;
        dateFilter.date=filter.date ||{value:[startDate,endDate]};
        if(dateFilter.date) {
            filterObjDate = filterMapper.mapFilter(dateFilter, {
                contentType: contentType,
                keysArray: ['date']
            });
        }
        var journalEntryList=[];
        journalEntry
            .aggregate([
                {
                    $match:filterObjDate
                },
                {
                    $lookup: {
                        from        : 'chartOfAccount',
                        localField  : 'account',
                        foreignField: '_id',
                        as          : 'account'
                    }
                },
                {
                    $lookup: {
                        from        : 'journals',
                        localField  : 'journal',
                        foreignField: '_id',
                        as          : 'journal'
                    }
                },
                {
                    $project:{
                        account      :{$arrayElemAt: ['$account', 0]},
                        journal      :{$arrayElemAt: ['$journal', 0]},
                        date         : 1,
                        debit        : 1,
                        credit       : 1
                    }
                }
            ],function(err,journalEntryResult){
                if(err){
                    next(err)
                }
                var metalPlateCosting=0;
                var sprayCosting=0;
                var data = {};
                if(journalEntryResult.length) {
                    async.each(journalEntryResult, function (journalEntryObj, journalEntryResultCb) {

                        var Account = journalEntryObj.account;
                        function findSubAccount(model) {
                            if (model&&model.subAccount) {
                                var id = model.subAccount;

                                chartOfAccount.findById(id)
                                    .populate('subAccount', '_id,subAccount,code ')
                                    .exec(function (err, account) {
                                        if (err) {
                                            next(err);
                                        }
                                        findSubAccount(account)
                                    });
                            } else {
                                if (model&&model.code == CONSTANTS.METALACCOUNT) {
                                    metalPlateCosting = metalPlateCosting + journalEntryObj.debit + journalEntryObj.credit;
                                    journalEntryList.push(journalEntryObj);
                                    journalEntryResultCb(null)
                                } else if (model&&model.code == CONSTANTS.SPRAYACCOUNT) {
                                    sprayCosting = sprayCosting + journalEntryObj.debit + journalEntryObj.credit;
                                    journalEntryList.push(journalEntryObj);
                                    journalEntryResultCb(null)
                                } else{
                                    journalEntryResultCb(null)
                                }
                            }

                        }

                        findSubAccount(Account);

                    }, function () {

                        data.metalPlateCosting = metalPlateCosting;
                        data.sprayCosting = sprayCosting;
                        data.journalEntryList=journalEntryList;
                        mainCallback(null, data);
                    })
                }else{
                    data.metalPlateCosting = metalPlateCosting;
                    data.sprayCosting = sprayCosting;
                    data.journalEntryList=journalEntryList;
                    mainCallback(null, data);
                }
            })
    }
    
    function getTotalOutput(req,mainCallback,next) {
        var building=models.get(req.session.lastDb,'building',buildingSchema);
        var materialProcessOutput=models.get(req.session.lastDb,'materialProcessOutput',materialProcessOutputSchema);
        var goodsInNote=models.get(req.session.lastDb, 'GoodsInNote', goodsInNoteSchema);
        var scanlog = models.get(req.session.lastDb, 'scanlogs', scanlogSchema);
        var OrderRows=models.get(req.session.lastDb, 'orderRows', OrderRowsSchema);
        var data = req.query;
        var contentType = data.contentType || 'costApportionment';
        var filter = data.filter || {};
        var filterMapper = new FilterMapper();
        var scanFilter={};
        var filterObjScanDate={};
        var dateFilter={};
        var filterObjDate={};
        var parallel;
        var startDate = moment(new Date()).startOf('month');
        startDate=new Date(startDate);
        var endDate =new Date() ;
        scanFilter.scantime=filter.date ||{value:[startDate,endDate]};
        if(scanFilter.scantime) {
            filterObjScanDate = filterMapper.mapFilter(scanFilter, {
                contentType: contentType,
                keysArray: ['scantime']
            });
        }
        dateFilter.date=filter.date ||{value:[startDate,endDate]};
        if(dateFilter.date) {
            filterObjDate = filterMapper.mapFilter(dateFilter, {
                contentType: contentType,
                keysArray: ['date']
            });
        }

        function metalPlateTotalOutput(metalCb) {
            var metalPlateTotalOutput=0;
            var sprayTotalOutput=0;
            scanlog
                .aggregate([
                    {
                        $match: filterObjScanDate
                    },
                    {
                        $lookup: {
                            from: 'workCentres',
                            localField: 'workCentre',
                            foreignField: '_id',
                            as: 'workCentre'
                        }
                    },
                    {
                        $project: {
                            workCentre        : {$arrayElemAt: ['$workCentre', 0]},
                            area              : 1
                        }
                    }
                ],function (err,scanlogResult) {
                    if(err){
                        next(err)
                    }
                    async.each(scanlogResult,function (scanlogObj,scanlogCb) {
                        if(scanlogObj.workCentre.code==CONSTANTS.METALWORKCODE){
                            metalPlateTotalOutput=metalPlateTotalOutput+scanlogObj.area;
                            scanlogCb(null)
                        }else if(scanlogObj.workCentre.code==CONSTANTS.SPRAYWORKCODE){
                            sprayTotalOutput=sprayTotalOutput+scanlogObj.area;
                            scanlogCb(null)
                        }else {
                            scanlogCb(null)
                        }
                    },function () {
                        var data={};
                        data.metalPlateTotalOutput=metalPlateTotalOutput;
                        data.sprayTotalOutput=sprayTotalOutput;
                        metalCb(null,data)
                    })
                })

        }
        
        function materialsTotalOutput(materialsCb) {
            var materialsOutput=0;
            goodsInNote
                .aggregate([
                    {
                        $match:filterObjDate
                    },
                    {
                        $match: {
                            reason: 'FI'
                        }
                    },
                    {
                        $project:{
                            _id        : 1,
                            orderRows  : 1
                        }
                    }
                ],function (err,goodsInNoteResult) {
                    if(err){
                        next(err)
                    }
                    async.each(goodsInNoteResult,function (goodsInNoteObj,goodsInNoteCb) {
                        async.each(goodsInNoteObj.orderRows,function (orderRowsObj,orderRowsCb) {
                            OrderRows
                                .aggregate([
                                    {
                                        $match:{
                                            _id:objectId(orderRowsObj.orderRowId)
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from        : 'Order',
                                            localField  : 'order',
                                            foreignField: '_id',
                                            as          : 'order'
                                        }
                                    },
                                    {
                                        $project:{
                                            _id         :1,
                                            quantity    :1,
                                            unitPrice   :1,
                                            priceQty    :1
                                        }
                                    }
                                ],function (err,orderRowResult) {
                                    if(err){
                                        next(err)
                                    }
                                    if(orderRowResult.length) {
                                        materialsOutput = materialsOutput + orderRowsObj.quantity * (orderRowResult[0].priceQty / orderRowResult[0].quantity);
                                    }
                                    orderRowsCb(null)
                                });
                        },function () {
                            goodsInNoteCb(null)
                        })
                    },function () {

                        materialsCb(null,materialsOutput)

                    })
                })
        }

        parallel=[metalPlateTotalOutput,materialsTotalOutput];
        async.parallel(parallel, function (err, result) {
            var aluOrder=result[0];
            var materials=result[1];
            var totalMetalPlateArea;
            var totalSprayArea;
            var data={};
            totalMetalPlateArea=aluOrder.metalPlateTotalOutput;
            totalSprayArea=aluOrder.sprayTotalOutput+materials;
            data.totalMetalPlateArea=totalMetalPlateArea;
            data.totalsparyArea=totalSprayArea;
            mainCallback(null,data)

        })

    }

    this.getForView=function (req, res, next) {
        var building=models.get(req.session.lastDb,'building',buildingSchema);
        var data = req.query;
        var sort = data.sort;
        var paginationObject = pageHelper(data);
        var contentType = data.contentType || 'costApportionment';
        var limit = paginationObject.limit;
        var skip = paginationObject.skip;
        var filter = data.filter || {};
        var nameFilter={};
        var filterObjName={};
        var optionsObjectName = [];
        var Output;
        var RawMaterialCosting;
        var ProcessingCost;
        var PublicCosting;
        var shippingCosing;
        var totalOutput;
        var metalPlateCosting=0;
        var sprayCosting=0;
        var TotalOutput=0;
        var journalEntryList=[];

        nameFilter.building=filter.building || {};
        if (filter.building) {
            filterObjName = filterMapper.mapFilter(nameFilter, contentType);
        }

        optionsObjectName.push(filterObjName);
        sort = {'_id': -1};

        PublicCosting = function (mainCallback) {
            getPublicCosting(req, mainCallback,next);
        };

        totalOutput = function (mainCallback) {
            getTotalOutput(req, mainCallback,next);
        };

        async.parallel([PublicCosting,totalOutput], function (err, result) {
            if (err) {
                return next(err);
            }
            metalPlateCosting=result[0].metalPlateCosting;
            sprayCosting=result[0].sprayCosting;
            journalEntryList=result[0].journalEntryList;
            TotalOutput=result[1];

            building
                .aggregate([
                    {
                        $project:{
                            _id                     : 1,
                            name                    : 1,
                            'createdBy.date'        : 1
                        }
                    },
                    {
                        $match: {
                            $and: optionsObjectName
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
                            _id                : '$root._id',
                            name               : '$root.name',
                            'createdBy.date'   : '$root.createdBy.date',
                            total              : 1
                        }
                    },
                    {
                        $sort: sort
                    }, {
                        $skip: skip
                    }, {
                        $limit: limit
                    }
                ],function (err,buildingResult) {
                    var datas=[];
                    var response={};
                    async.each(buildingResult,function (buildingObj,buildingCb) {
                        var id=buildingObj._id;
                        Output = function (mainCallback) {
                            getOutputByBuildingAndDate(req, mainCallback,id,next);
                        };
                        RawMaterialCosting = function (mainCallback) {
                            getRawMaterialCosting(req, mainCallback,id,next);
                        };
                        ProcessingCost = function (mainCallback) {
                            getProcessingCost(req, mainCallback,id,next);
                        };
                        shippingCosing=function (mainCallback) {
                            getShippingCosting(req, mainCallback,id,next)
                        };
                        async.parallel([Output, RawMaterialCosting,ProcessingCost,shippingCosing], function (err, result) {
                            if (err) {
                                return next(err);
                            }
                            var data={};
                            data.totalMetalPlateArea=result[0].totalMetalPlateArea;
                            data.totalsparyArea=result[0].totalsparyArea;
                            data.sprayList=result[0].sprayList;
                            data.aluList=result[0].aluList;
                            data.materialsList=result[0].materialsList;
                            data.building=buildingObj;
                            data.date=result[0].date;
                            data.rawMaterialCosting=result[1].rawMaterialCosting;
                            data.orderRowList=result[1].orderRowList;
                            data.processingCost=result[2].processingCost;
                            data.scanList=result[2].scanList;
                            data.metalPlateCosting=metalPlateCosting;
                            data.sprayCosting=sprayCosting;
                            data.shippingCosting=result[3];
                            data.totalOutput=TotalOutput;
                            data.journalEntryList=journalEntryList;
                            data._id=buildingObj._id;
                            datas.push(data);
                            buildingCb(null)

                        });
                    },function () {
                        response.data=datas;
                        response.total=buildingResult.length;
                        res.status(200).send(response);
                    })
                });


        });

    };

};

module.exports = Module;

