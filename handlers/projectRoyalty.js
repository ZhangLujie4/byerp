var mongoose = require('mongoose');
var RESPONSES = require('../constants/responses');
var buildingContractSchema=mongoose.Schemas.BuildingContract;
var orderSchema=mongoose.Schemas.Order;
var goodNoteSchema=mongoose.Schemas.GoodsOutNote;
var projectRoyaltySchema=mongoose.Schemas.projectRoyalty;
var buildingSchema = mongoose.Schemas.Building;
var objectId = mongoose.Types.ObjectId;

var _ = require('underscore');
var async = require('async');

var Module = function (models, event) {
    'use strict';

    var validator = require('../helpers/validator');

    var fs = require('fs');
    var path = require('path');
    var Uploader = require('../services/fileStorage/index');
    var uploader = new Uploader();
    var FilterMapper = require('../helpers/filterMapper');
    var accessRoll = require('../helpers/accessRollHelper.js')(models);

    this.create = function (req, res, next) {
        var buildingContract = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', goodNoteSchema);
        var ProjectRoyalty= models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema);
        var body = req.body;
        var data={};
        var buildingContractId=body.contractId;
        var goodsNoteId=body.goodsNoteId;

        ProjectRoyalty
            .aggregate([
                {
                    $match: {
                        buildingProject          : objectId(buildingContractId)
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        allNote                     : 1
                    }
                }

            ],function (err,rest) {
                if(rest.length==0){
                    buildingContract
                        .aggregate([
                            {
                                $match: {
                                    _id          : objectId(buildingContractId)
                                }
                            },
                            {
                                $project: {
                                    _id                         : 1,
                                    clerk1                      : 1,
                                    clerk2                      : 1,
                                    clerk3                      : 1,
                                    merchandiser1               : 1,
                                    merchandiser2               : 1,
                                    merchandiser3               : 1,
                                    clerkRate1                  : 1,
                                    clerkRate2                  : 1,
                                    clerkRate3                  : 1,
                                    merchandiserRate1           : 1,
                                    merchandiserRate2           : 1,
                                    merchandiserRate3           : 1,
                                    earnest                     : 1,
                                    payRate1                    : 1,
                                    projectCost                 : 1
                                }
                            }
                        ],function (err,result) {
                            var persons=[];
                            var person={};
                            if(result[0].clerk1){
                                person={};
                                person.name=result[0].clerk1;
                                person.rate=result[0].clerkRate1;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].clerk2){
                                person={};
                                person.name=result[0].clerk2;
                                person.rate=result[0].clerkRate2;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].clerk3){
                                person={};
                                person.name=result[0].clerk3;
                                person.rate=result[0].clerkRate3;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser1){
                                person={};
                                person.name=result[0].merchandiser1;
                                person.rate=result[0].merchandiserRate1;
                                person.type='跟单员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser2){
                                person={};
                                person.name=result[0].merchandiser2;
                                person.rate=result[0].merchandiserRate2;
                                person.type='跟单员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser3){
                                person={};
                                person.name=result[0].merchandiser3;
                                person.rate=result[0].merchandiserRate3;
                                person.type='跟单员';
                                persons.push(person);
                            }
                            data.persons=persons;
                            data.createdBy = {
                                date: new Date(),
                                user: req.session.uId
                            };


                            if(result[0].earnest){
                                data.advance=data.advance+result[0].earnest;
                            }

                            if(goodsNoteId) {
                                var allNote=[];
                                var outNotes={};
                                outNotes.goodsNote = goodsNoteId;
                                allNote.push(outNotes);
                                data.allNote=allNote;
                            }

                            data.buildingProject=buildingContractId;

                            var newProjectRoyalty;
                            newProjectRoyalty = new ProjectRoyalty(data);
                            newProjectRoyalty.save(function (err, result) {
                                if (err) {
                                    return next(err);
                                }

                                res.status(200).send({success: 'success',id: result._id});
                            });

                        });

                } else{
                    var allNote=rest[0].allNote;
                    var _id=rest[0]._id;
                    var same=1;
                    for(var k=0;k<allNote.length;k++){
                        if(allNote[k].goodsNote==goodsNoteId){
                            same=0;
                        }
                    }
                    if(same && goodsNoteId) {
                        var outNotes = {};
                        outNotes.goodsNote = goodsNoteId;
                        data.buildingProject = buildingContractId;
                        data.editedBy = {
                            date: new Date(),
                            user: req.session.uId
                        };

                        allNote.push(outNotes);
                        data.allNote = allNote;
                        models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

                            res.send(200, {success: 'A new royalty update success',id: result._id});
                        });
                    } else{
                        return next(err);
                    }

                }
            })
    };

    this.getInfo = function (req, res, next) {
        var viewType = req.query.viewType;

        switch (viewType) {
            case 'list':
                getContractList(req, res, next);
                break;
        }

    };

    this.getContractInfo=function (req, res, next) {
        var body=req.query;
        var projectRoyalty = models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', goodNoteSchema);
        var BuildingModel = models.get(req.session.lastDb, 'building', buildingSchema);
        var id=body.id;
        projectRoyalty.findById(id)
            .populate('buildingProject')
            .exec(function (err, result) {

                if (err) {
                    return next(err);
                }
                var noteIds;
                var paymentIds;
                var buildingID=result.buildingProject.projectName;
                noteIds=result.allNote.map(function (element) {
                    return element.goodsNote;
                });

                paymentIds=result.royalties.map(function (element) {
                    return element.payment;
                });

                GoodsOutNote.find({'_id': {$in: noteIds}})
                    .exec(function (err, results) {
                        BuildingModel.find(buildingID)
                            .exec(function (err, building) {
                                var response={};
                                response.data=result;
                                response.note=results;
                                response.payment=paymentIds;
                                response.building=building;
                                res.status(200).send(response);

                            })

                    })
            });

    };

    function getContractList(req, res, next) {
        var body=req.query;
        var limit = parseInt(body.count, 10);
        var skip = (parseInt(body.page || 1, 10) - 1) * limit;
        var sort;
        var projectRoyalty = models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', goodNoteSchema);

        sort = {'_id': 1};
        projectRoyalty
            .aggregate([
                {
                    $lookup: {
                        from        : 'buildingContract',
                        localField  : 'buildingProject',
                        foreignField: '_id',
                        as          : 'buildingProject'
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        buildingProject             : {$arrayElemAt: ['$buildingProject', 0]},
                        allNote                     : 1,
                        royalties                   : 1
                    }
                },
                {
                    $lookup: {
                        from        : 'building',
                        localField  : 'buildingProject.projectName',
                        foreignField: '_id',
                        as          : 'buildingName'
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        buildingProject             : 1,
                        allNote                     : 1,
                        royalties                   : 1,
                        buildingName                : {$arrayElemAt: ['$buildingName', 0]},
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
                        _id                          :'$root._id',
                        buildingProject              :'$root.buildingProject',
                        allNote                      :'$root.allNote',
                        royalties                    :'$root.royalties',
                        buildingName                 :'$root.buildingName',
                        total                        :1
                    }
                },
                {
                    $sort: sort
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }
            ], function (err, result) {
                var count;
                var response = {};
                if (err) {
                    return next(err);
                }
                var parallelTasks;
                var resultLength=result.length;
                var data=[];
                count = result[0] && result[0].total ? result[0].total : 0;
                if(count==0){
                    response.total = count;
                    response.result = data;
                    res.status(200).send(response);
                }else {
                    async.each(result, function (results, cb) {
                        var allNotes = results.allNote;
                        var royalty = results.royalties;

                        function getNoteInfo(cb) {
                            var noteAmount = 0;
                            var noteArea = 0;
                            var length = allNotes.length;
                            var date = {};
                            if (length > 0) {
                                async.each(allNotes, function (allNote, cbs) {
                                    var goodsNoteId = allNote.goodsNote;
                                    GoodsOutNote.findById(goodsNoteId)
                                        .exec(function (err, note) {

                                            if (err) {
                                                return next(err);
                                            }
                                            note.orderRows.forEach(function (row) {
                                                row.parameters.forEach(function (parameters) {
                                                    if (parameters.paraname.indexOf('积')>=0) {
                                                        noteArea = noteArea + parameters.value * 1 * row.quantity;
                                                    }
                                                });
                                                noteAmount = noteAmount + row.cost * row.quantity;
                                            });
                                            length = length - 1;
                                            if (length == 0) {
                                                date = {
                                                    noteArea: noteArea,
                                                    noteAmount: noteAmount
                                                };
                                                cb(null, date)
                                            }
                                        });


                                });
                            } else {
                                date = {
                                    noteArea: noteArea,
                                    noteAmount: noteAmount
                                };
                                cb(null, date)
                            }
                        }

                        function getPaymentInfo(cb) {
                            var receive = 0;
                            for (var k = 0; k < royalty.length; k++) {
                                var paymentId = royalty[k].payment;

                                receive = receive + paymentId.paidAmount * 1;


                            }
                            cb(null, receive);
                        }

                        parallelTasks = [getNoteInfo, getPaymentInfo];
                        async.parallel(parallelTasks, function (err, result) {
                            var a = result[0];
                            var b = result[1];
                            resultLength = resultLength - 1;
                            results.allArea = a.noteArea;
                            results.allAmount = a.noteAmount;
                            results.allReceive = b;
                            data.push(results);
                            if (resultLength == 0) {
                                response.total = count;
                                response.data = data;
                                res.status(200).send(response);
                            }

                        });
                    });
                }


            })
    }

    this.Update = function (req, res, next) {
        var _id = req.params._id;
        var data = req.body.data;
        var fileName = data.fileName;
        var projectRoyalty = models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema);

        var newData={};
        if(data.noteId){
            var noteId=data.noteId;
            projectRoyalty
                .aggregate([
                    {
                        $match: {
                            _id          : objectId(_id)
                        }
                    },
                    {
                        $lookup: {
                            from        : 'buildingContract',
                            localField  : 'buildingProject',
                            foreignField: '_id',
                            as          : 'buildingProject'
                        }
                    },
                    {
                        $project: {
                            _id                         : 1,
                            allNote                     : 1,
                            buildingProject             : 1,
                            mergeNote                   : 1,
                            advance                     : 1
                        }
                    }

                ],function (err,result) {
                    var buildingContract=result[0].buildingProject;
                    var allNote=result[0].allNote;
                    var mergeNote=result[0].mergeNote;
                    var advance=result[0].advance;
                    if(buildingContract[0].payRate3 || buildingContract[0].payRate4){
                        var addUp=0;
                        var standard;
                        if(buildingContract[0].payRate3){
                            if(data.mergeNote.length>0) {
                                if (data.mergeNote[data.mergeNote.length - 1].dueDate) {
                                    addUp = 0
                                } else {
                                    addUp = data.mergeNote[data.mergeNote.length - 1].mergeTotalArea
                                }
                            }else{
                                addUp=0;
                            }
                            standard=buildingContract[0].areaSettle;
                            addUp=addUp*1+data.totalArea*1;

                        } else{
                            if(data.mergeNote) {
                                if (data.mergeNote[data.mergeNote.length - 1].dueDate) {
                                    addUp = 0
                                } else {
                                    addUp = data.mergeNote[data.mergeNote.length - 1].mergeTotalAmount
                                }
                            }
                            standard=buildingContract[0].amountSettle;
                            addUp=addUp*1+data.totalAmount*1
                        }
                        newData.allNote=[];
                        var first=0;
                        for(var i=0;i<allNote.length;i++) {
                            newData.allNote[i] = {};
                            newData.allNote[i].confirmDate = allNote[i].confirmDate;
                            newData.allNote[i].dueDate = allNote[i].dueDate;
                            newData.allNote[i].goodsNote = allNote[i].goodsNote;
                            newData.allNote[i]._id = allNote[i]._id;
                            newData.allNote[i].flag = allNote[i].flag;
                            newData.allNote[i].calculate = allNote[i].calculate;
                            newData.allNote[i].paidAmount = allNote[i].totalAmount ;
                            newData.allNote[i].confirmAmount = allNote[i].confirmAmount ;
                            newData.allNote[i].confirmArea = allNote[i].confirmArea ;
                            if (allNote[i].goodsNote == noteId) {
                                newData.allNote[i].confirmDate = data.confirmDate;
                                newData.allNote[i].dueDate = data.dueDate;
                                newData.allNote[i].confirmAmount=data.confirmAmount;
                                newData.allNote[i].confirmArea=data.confirmArea;
                                newData.allNote[i].goodsNote = allNote[i].goodsNote;
                                newData.allNote[i]._id = allNote[i]._id;
                                newData.allNote[i].flag = allNote[i].flag;
                                newData.allNote[i].calculate = allNote[i].calculate;
                                if(!allNote[i].confirmDate && !allNote[i].dueDate) {
                                    first=1;
                                    if (advance > data.totalAmount * 1) {
                                        newData.advance = advance - data.totalAmount * 1;
                                        newData.allNote[i].paidAmount = data.totalAmount * 1;
                                    } else {
                                        newData.advance = 0;
                                        newData.allNote[i].paidAmount = advance;

                                    }
                                }
                            }
                        }
                        newData.mergeNote=[];

                        for(var m=0;m<mergeNote.length;m++){
                            newData.mergeNote[m]=mergeNote[m]
                        }
                        var newMerge={};
                        if(addUp>standard){
                            newMerge.dueDate=data.dueDate;
                        }
                        if(first) {
                            if(data.mergeNote.length==0){
                                newMerge.note = [];
                                newMerge.note.push(noteId);
                                newData.mergeNote.push(newMerge) ;
                            } else {
                                if (data.mergeNote[data.mergeNote.length - 1].dueDate) {
                                    newMerge.note = [];
                                    newMerge.note.push(noteId);
                                    newData.mergeNote.push(newMerge)

                                } else {
                                    newMerge.note = newData.mergeNote[data.mergeNote.length - 1].note;
                                    newMerge.note.push(noteId);
                                    newData.mergeNote[data.mergeNote.length - 1] = newMerge;
                                }
                            }
                        }

                    } else{
                        newData.allNote=[];
                        for(var n=0;n<allNote.length;n++){
                            newData.allNote[n]={};
                            newData.allNote[n].confirmDate = allNote[n].confirmDate;
                            newData.allNote[n].dueDate = allNote[n].dueDate;
                            newData.allNote[n].goodsNote = allNote[n].goodsNote;
                            newData.allNote[n]._id = allNote[n]._id;
                            newData.allNote[n].flag = allNote[n].flag;
                            newData.allNote[n].calculate = allNote[n].calculate;
                            newData.allNote[n].paidAmount = allNote[n].paidAmount ;
                            newData.allNote[n].confirmAmount = allNote[n].confirmAmount ;
                            newData.allNote[n].confirmArea = allNote[n].confirmArea ;
                            if(allNote[n].goodsNote==noteId){
                                newData.allNote[n].confirmDate=data.confirmDate;
                                newData.allNote[n].dueDate=data.dueDate;
                                newData.allNote[n].confirmAmount=data.confirmAmount;
                                newData.allNote[n].confirmArea=data.confirmArea;
                                newData.allNote[n].goodsNote=allNote[n].goodsNote;
                                newData.allNote[n].flag=allNote[n].flag;
                                newData.allNote[n].calculate=allNote[n].calculate;
                                newData.allNote[n].paidAmount = allNote[n].paidAmount;
                                if(!allNote[n].confirmDate && !allNote[n].dueDate) {
                                    if (advance > data.totalAmount * 1) {
                                        newData.advance = advance - data.totalAmount * 1;
                                        newData.allNote[n].paidAmount = data.totalAmount * 1;
                                    } else {
                                        newData.advance = 0;
                                        newData.allNote[n].paidAmount = advance;
                                    }
                                }
                                newData.allNote[n]._id=allNote[n]._id;
                            }
                        }
                    }
                    models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema).findByIdAndUpdate(_id, {$set: newData}, {new: true}, function (err, result) {

                        var os = require('os');
                        var osType = (os.type().split('_')[0]);
                        var path;
                        var dir;
                        var newDirname;

                        if (err) {
                            return next(err);
                        }

                        if (fileName) {
                            switch (osType) {
                                case 'Windows':
                                    newDirname = __dirname.replace('\\Modules', '');
                                    while (newDirname.indexOf('\\') !== -1) {
                                        newDirname = newDirname.replace('\\', '\/');
                                    }
                                    path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                                    dir = newDirname + '\/uploads\/' + _id;
                                    break;
                                case 'Linux':
                                    newDirname = __dirname.replace('/Modules', '');
                                    while (newDirname.indexOf('\\') !== -1) {
                                        newDirname = newDirname.replace('\\', '\/');
                                    }
                                    path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                                    dir = newDirname + '\/uploads\/' + _id;
                            }
                            fs.unlink(path, function (err) {
                                console.log(err);
                                fs.readdir(dir, function (err, files) {
                                    if (files && files.length === 0) {
                                        fs.rmdir(dir, function () {
                                        });
                                    }
                                });
                            });
                        }
                        res.send(200,{success: 'A new Project crate success', result: result, id: result._id});
                    });
                })
        }else {
            data.editedBy = {
                date: new Date(),
                user: req.session.uId
            };

            delete data.createdBy;
            delete data.fileName;
            models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

                var os = require('os');
                var osType = (os.type().split('_')[0]);
                var path;
                var dir;
                var newDirname;

                if (err) {
                    return next(err);
                }

                if (fileName) {
                    switch (osType) {
                        case 'Windows':
                            newDirname = __dirname.replace('\\Modules', '');
                            while (newDirname.indexOf('\\') !== -1) {
                                newDirname = newDirname.replace('\\', '\/');
                            }
                            path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                            dir = newDirname + '\/uploads\/' + _id;
                            break;
                        case 'Linux':
                            newDirname = __dirname.replace('/Modules', '');
                            while (newDirname.indexOf('\\') !== -1) {
                                newDirname = newDirname.replace('\\', '\/');
                            }
                            path = newDirname + '\/uploads\/' + _id + '\/' + fileName;
                            dir = newDirname + '\/uploads\/' + _id;
                    }
                    fs.unlink(path, function (err) {
                        console.log(err);
                        fs.readdir(dir, function (err, files) {
                            if (files && files.length === 0) {
                                fs.rmdir(dir, function () {
                                });
                            }
                        });
                    });
                }
                res.send(200, {success: 'A new Project crate success', result: result, id: result._id});
            });
        }

    };

    this.remove = function (req, res, next) {
        var _id = req.params._id;
        var data={};
        data.editedBy = {
            date: new Date(),
            user: req.session.uId
        };
        data.state='delete';

        models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema).findByIdAndUpdate(_id, {$set: data}, {new: true}, function (err, result) {

            res.send(200);
        });
    };

    this.getContract = function (req, res, next) {

        var data=req.query;
        var project = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        project
            .aggregate([
                {
                    $project: {
                        _id                         : 1,
                        contractNum                 : 1

                    }
                },
                {
                    $group: {
                        _id  : null,
                        root : {$push: '$$ROOT'}
                    }
                },
                {
                    $unwind: '$root'
                },
                {
                    $project: {
                        _id                          :'$root._id',
                        name                         :'$root.contractNum'

                    }
                }
            ], function (err, result) {

                if (err) {
                    return next(err);
                }


                res.status(200).send(result);
            });


    };
    
    this.getOrder=function (req,res,next) {
        var data=req.query;
        var Id=data.id;
        var Order = models.get(req.session.lastDb, 'Order', orderSchema);

        Order
            .aggregate([
                {
                    $match: {
                        building :objectId(Id),
                        orderType:'salesOrder'

                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        name                        : 1

                    }
                },
                {
                    $group: {
                        _id  : null,
                        root : {$push: '$$ROOT'}
                    }
                },
                {
                    $unwind: '$root'
                },
                {
                    $project: {
                        _id                          :'$root._id',
                        name                         :'$root.name'

                    }
                }
            ], function (err, result) {

                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });

    };
    
    this.getGoodNotes=function (req,res,next) {
        var data=req.query;
        var Id=data.id;
        var project = models.get(req.session.lastDb, 'GoodsOutNote', goodNoteSchema);

        project
            .aggregate([
                {
                    $match: {
                        order :objectId(Id)

                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        name                        : 1

                    }
                },
                {
                    $group: {
                        _id  : null,
                        root : {$push: '$$ROOT'}
                    }
                },
                {
                    $unwind: '$root'
                },
                {
                    $project: {
                        _id                          :'$root._id',
                        name                         :'$root.name'

                    }
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });

    };

    this.getNoteInfo = function (req, res, next) {
        var viewType = req.query.viewType;

        switch (viewType) {
            case 'list':
                getGoodOutNote(req, res, next);
                break;
            case 'form':
                getGoodOutNoteInfo(req, res, next);
                break;
        }

    };

    function getGoodOutNote (req,res,next) {
        var body=req.query;
        var limit = parseInt(body.count, 10);
        var skip = (parseInt(body.page || 1, 10) - 1) * limit;
        var filter=body.filter ||{};
        var sort;
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', goodNoteSchema);
        sort = {'date': 1};
        GoodsOutNote
            .aggregate([
                {
                    $match:{
                        _type:'GoodsOutNote'
                    }
                },
                {
                    $match:filter
                },
                {
                    $project: {
                        _id                         : 1,
                        orderRows                   : 1,
                        name                        : 1,
                        order                       : 1,
                        date                        : 1
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
                    $project: {
                        _id                         : 1,
                        orderRows                   : 1,
                        name                        : 1,
                        order                       : {$arrayElemAt: ['$order', 0]},
                        date                        : 1
                    }
                },
                {
                    $match:{
                        'order.orderType':'salesOrder'
                    }
                },
                {
                    $lookup: {
                        from        : 'projectRoyalty',
                        localField  : 'order.building',
                        foreignField: 'buildingProject',
                        as          : 'projectRoyalty'
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        orderRows                   : 1,
                        name                        : 1,
                        order                       : 1,
                        date                        : 1,
                        projectRoyalty            : {$arrayElemAt: ['$projectRoyalty', 0]}
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
                        _id                          :'$root._id',
                        orderRows                    :'$root.orderRows',
                        name                         :'$root.name',
                        order                        :'$root.order',
                        date                         :'$root.date',
                        projectRoyalty               :'$root.projectRoyalty',
                        total                        :1
                    }
                },
                {
                    $sort: sort
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }
            ], function (err, result) {
                var resultList=[];
                async.each(result,function (NoteObj,NoteCb){
                    var noteArea=0;
                    var noteAmount=0;
                    async.each(NoteObj.orderRows,function (orderRowsObj,orderRowsCb) {
                        async.each(orderRowsObj.parameters,function (parametersObj,parametersCb) {
                            if(parametersObj.paraname=='面积'){
                                noteArea = noteArea + parametersObj.value * 1 * orderRowsObj.quantity;
                            }
                            parametersCb(null)
                        },function (err) {
                            if(err){
                                next(err)
                            }
                            noteAmount = noteAmount + orderRowsObj.cost * orderRowsObj.quantity;
                            orderRowsCb(null)
                        });

                    },function (err) {
                        if(err){
                            next(err)
                        }
                        NoteObj.noteArea=noteArea;
                        NoteObj.noteAmount=noteAmount;
                        NoteObj.confirmArea=0;
                        NoteObj.confirmAmount=0;
                        NoteObj.confirmDate='';
                        NoteObj.dueDate='';
                        if(NoteObj.projectRoyalty){
                            if(NoteObj.projectRoyalty.allNote.length) {
                                async.each(NoteObj.projectRoyalty.allNote,function (allNoteObj,allNoteCb) {
                                    if(allNoteObj.goodsNote.toString() ==NoteObj._id.toString()){
                                        NoteObj.confirmArea = allNoteObj.confirmArea;
                                        NoteObj.confirmAmount = allNoteObj.confirmAmount;
                                        NoteObj.confirmDate = allNoteObj.confirmDate;
                                        NoteObj.dueDate = allNoteObj.dueDate;
                                    }
                                    allNoteCb(null)
                                },function (err) {
                                    if(err){
                                        next(err)
                                    }
                                    resultList.push(NoteObj);
                                    NoteCb(null)
                                })
                            }else{
                                resultList.push(NoteObj);
                                NoteCb(null)
                            }
                        }else{
                            resultList.push(NoteObj);
                            NoteCb(null)
                        }
                    })
                },function () {
                    var count;
                    var response = {};
                    if (err) {
                        return next(err);
                    }
                    count = result[0] && result[0].total ? result[0].total : 0;
                    response.total = count;
                    response.data = resultList;
                    res.status(200).send(response);
                });

            });
    }

    function getGoodOutNoteInfo (req,res,next) {
        var body=req.query;
        var id=body.id;
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', goodNoteSchema);
        GoodsOutNote
            .aggregate([
                {
                    $match:{
                        _id:objectId(id)
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        orderRows                   : 1,
                        name                        : 1,
                        order                       : 1,
                        date                        : 1
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
                    $project: {
                        _id                         : 1,
                        orderRows                   : 1,
                        name                        : 1,
                        order                       : {$arrayElemAt: ['$order', 0]},
                        date                        : 1
                    }
                },
                {
                    $lookup: {
                        from        : 'projectRoyalty',
                        localField  : 'order.buildingContract',
                        foreignField: 'buildingProject',
                        as          : 'projectRoyalty'
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        orderRows                   : 1,
                        name                        : 1,
                        order                       : 1,
                        date                        : 1,
                        projectRoyalty            : {$arrayElemAt: ['$projectRoyalty', 0]}
                    }
                }
            ], function (err, result) {
                var noteArea=0;
                var noteAmount=0;
                result[0].orderRows.forEach(function (row) {
                    row.parameters.forEach(function (parameters) {
                        if (parameters.paraname.indexOf('积')) {
                            noteArea = noteArea + parameters.value * 1 * row.quantity;
                        }
                    });
                    noteAmount = noteAmount + row.cost * row.quantity;
                });
                result[0].noteArea=noteArea;
                result[0].noteAmount=noteAmount;
                if(result[0].projectRoyalty){
                    if(result[0].projectRoyalty.allNote.length) {
                        var same = 0;
                        result[0].projectRoyalty.allNote.forEach(function (note) {
                            if (note.goodsNote.toString() == result[0]._id.toString()) {
                                same = 1;
                                result[0].confirmArea = note.confirmArea;
                                result[0].confirmAmount = note.confirmAmount;
                                result[0].confirmDate = note.confirmDate;
                                result[0].dueDate = note.dueDate;
                            }
                        });
                        if (same == 0) {
                            result[0].confirmArea = 0;
                            result[0].confirmAmount = 0;
                            result[0].confirmDate = '';
                            result[0].dueDate = '';
                        }
                    }
                }else{
                    result[0].confirmArea=0;
                    result[0].confirmAmount=0;
                    result[0].confirmDate='';
                    result[0].dueDate='';
                }

                res.status(200).send(result[0]);

            });
    };

    this.createAndUpdate=function (req, res, next) {
        var buildingContract = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var GoodsOutNote = models.get(req.session.lastDb, 'GoodsOutNote', goodNoteSchema);
        var ProjectRoyalty= models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema);
        var data = req.body;
        var buildingContractId=data.contractId;
        var goodsNoteId=data.goodsNoteId;

        ProjectRoyalty
            .aggregate([
                {
                    $match: {
                        buildingProject          : objectId(buildingContractId)
                    }
                },
                {
                    $lookup: {
                        from        : 'buildingContract',
                        localField  : 'buildingProject',
                        foreignField: '_id',
                        as          : 'buildingProject'
                    }
                },
                {
                    $project: {
                        _id                         : 1,
                        allNote                     : 1,
                        buildingProject             : 1,
                        mergeNote                   : 1,
                        advance                     : 1
                    }
                }

            ],function (err,rest) {
                if(rest.length==0){
                    buildingContract
                        .aggregate([
                            {
                                $match: {
                                    _id          : objectId(buildingContractId)
                                }
                            },
                            {
                                $project: {
                                    _id                         : 1,
                                    clerk1                      : 1,
                                    clerk2                      : 1,
                                    clerk3                      : 1,
                                    merchandiser1               : 1,
                                    merchandiser2               : 1,
                                    merchandiser3               : 1,
                                    clerkRate1                  : 1,
                                    clerkRate2                  : 1,
                                    clerkRate3                  : 1,
                                    merchandiserRate1           : 1,
                                    merchandiserRate2           : 1,
                                    merchandiserRate3           : 1,
                                    earnest                     : 1,
                                    payRate1                    : 1,
                                    projectCost                 : 1,
                                    payRate3                    : 1,
                                    payRate4                    : 1,
                                    areaSettle                  : 1,
                                    amountSettle                : 1

                                }
                            }
                        ],function (err,result) {
                            var persons=[];
                            var person={};
                            var newData={};
                            if(result[0].clerk1){
                                person={};
                                person.name=result[0].clerk1;
                                person.rate=result[0].clerkRate1;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].clerk2){
                                person={};
                                person.name=result[0].clerk2;
                                person.rate=result[0].clerkRate2;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].clerk3){
                                person={};
                                person.name=result[0].clerk3;
                                person.rate=result[0].clerkRate3;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser1){
                                person={};
                                person.name=result[0].merchandiser1;
                                person.rate=result[0].merchandiserRate1;
                                person.type='跟单员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser2){
                                person={};
                                person.name=result[0].merchandiser2;
                                person.rate=result[0].merchandiserRate2;
                                person.type='跟单员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser3){
                                person={};
                                person.name=result[0].merchandiser3;
                                person.rate=result[0].merchandiserRate3;
                                person.type='跟单员';
                                persons.push(person);
                            }
                            newData.persons=persons;
                            newData.createdBy = {
                                date: new Date(),
                                user: req.session.uId
                            };
                            if(goodsNoteId) {
                                var allNote=[];
                                var outNotes={};
                                outNotes.goodsNote = goodsNoteId;
                                outNotes.confirmAmount=data.confirmAmount;
                                outNotes.confirmArea=data.confirmArea;
                                outNotes.confirmDate=data.confirmDate;
                                outNotes.dueDate=data.dueDate;
                                allNote.push(outNotes);
                                newData.allNote=allNote;
                            }
                            if(result[0].payRate3||result[0].payRate4){
                                var addUp=0;
                                var standard;
                                if(result[0].payRate3){
                                    standard=result[0].areaSettle;
                                    addUp=data.confirmArea*1;

                                } else{
                                    standard=result[0].amountSettle;
                                    addUp=data.confirmAmount*1
                                }
                                var mergeNote=[];
                                var newMerge={};
                                if(addUp>standard){
                                    newMerge.dueDate=data.dueDate;
                                }
                                newMerge.note = [];
                                newMerge.note.push(goodsNoteId);
                                mergeNote.push(newMerge) ;
                                newData.mergeNote=mergeNote;
                            }

                            newData.buildingProject=buildingContractId;

                            var newProjectRoyalty;
                            newProjectRoyalty = new ProjectRoyalty(newData);
                            newProjectRoyalty.save(function (err, result) {
                                if (err) {
                                    return next(err);
                                }
                                res.status(201).send({success: 'success',id: result._id});
                            });
                        });

                } else{
                    var newDatas={};
                    var allNote=rest[0].allNote;
                    var _id=rest[0]._id;
                    var same=1;
                    for(var k=0;k<allNote.length;k++){
                        if(allNote[k].goodsNote==goodsNoteId){
                            same=0;
                        }
                    }
                    if(same && goodsNoteId) {
                        var outNotes = {};
                        outNotes.goodsNote = goodsNoteId;
                        outNotes.confirmAmount=data.confirmAmount;
                        outNotes.confirmArea=data.confirmArea;
                        outNotes.confirmDate=data.confirmDate;
                        outNotes.dueDate=data.dueDate;
                        newDatas.buildingProject = buildingContractId;
                        newDatas.editedBy = {
                            date: new Date(),
                            user: req.session.uId
                        };
                        allNote.push(outNotes);
                        newDatas.allNote = allNote;
                        buildingContract
                            .aggregate([
                                {
                                    $match: {
                                        _id          : objectId(buildingContractId)
                                    }
                                },
                                {
                                    $project: {
                                        _id                         : 1,
                                        payRate3                    : 1,
                                        payRate4                    : 1,
                                        areaSettle                  : 1,
                                        amountSettle                : 1

                                    }
                                }
                            ],function (err,result) {
                                if(result[0].payRate3||result[0].payRate4){
                                    var addUp=0;
                                    var standard;
                                    if(result[0].payRate3){
                                        if(data.mergeNote.length>0) {
                                            if (data.mergeNote[data.mergeNote.length - 1].dueDate) {
                                                addUp = 0
                                            } else {
                                                addUp = data.mergeNote[data.mergeNote.length - 1].mergeTotalArea
                                            }
                                        }else{
                                            addUp=0;
                                        }
                                        standard=result[0].areaSettle;
                                        addUp=addUp*1+data.confirmArea*1;

                                    } else{
                                        if(data.mergeNote) {
                                            if (data.mergeNote[data.mergeNote.length - 1].dueDate) {
                                                addUp = 0
                                            } else {
                                                addUp = data.mergeNote[data.mergeNote.length - 1].mergeTotalAmount
                                            }
                                        }
                                        standard=result[0].amountSettle;
                                        addUp=addUp*1+data.confirmAmount*1
                                    }

                                    newDatas.mergeNote=[];
                                    var mergeNote=rest[0].mergeNote;

                                    for(var m=0;m<mergeNote.length;m++){
                                        newDatas.mergeNote[m]=mergeNote[m]
                                    }
                                    var newMerge={};
                                    if(addUp>standard){
                                        newMerge.dueDate=data.dueDate;
                                    }
                                    if (data.mergeNote[data.mergeNote.length - 1].dueDate) {
                                        newMerge.note = [];
                                        newMerge.note.push(goodsNoteId);
                                        newDatas.mergeNote.push(newMerge)
                                    } else {
                                        newMerge.note = mergeNote[data.mergeNote.length - 1].note;
                                        newMerge.note.push(goodsNoteId);
                                        newDatas.mergeNote[data.mergeNote.length - 1] = newMerge;
                                    }

                                    models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema).findByIdAndUpdate(_id, {$set: newDatas}, {new: true}, function (err, result) {

                                        res.send(200, {success: 'A new royalty update success',id: result._id});
                                    });
                                }else{
                                    models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema).findByIdAndUpdate(_id, {$set: newDatas}, {new: true}, function (err, result) {

                                        res.send(200, {success: 'A new royalty update success',id: result._id});
                                    });
                                }


                            });
                    } else{
                        var newDatass={};
                        newDatass.allNote=[];
                        for(var n=0;n<allNote.length;n++){
                            newDatass.allNote[n]={};
                            newDatass.allNote[n].confirmDate = allNote[n].confirmDate;
                            newDatass.allNote[n].dueDate = allNote[n].dueDate;
                            newDatass.allNote[n].goodsNote = allNote[n].goodsNote;
                            newDatass.allNote[n]._id = allNote[n]._id;
                            newDatass.allNote[n].flag = allNote[n].flag;
                            newDatass.allNote[n].calculate = allNote[n].calculate;
                            newDatass.allNote[n].paidAmount = allNote[n].paidAmount ;
                            newDatass.allNote[n].confirmAmount = allNote[n].confirmAmount ;
                            newDatass.allNote[n].confirmArea = allNote[n].confirmArea ;
                            if(allNote[n].goodsNote==goodsNoteId){
                                newDatass.allNote[n].confirmDate=data.confirmDate;
                                newDatass.allNote[n].dueDate=data.dueDate;
                                newDatass.allNote[n].confirmAmount=data.confirmAmount;
                                newDatass.allNote[n].confirmArea=data.confirmArea;
                                newDatass.allNote[n].goodsNote=allNote[n].goodsNote;
                                newDatass.allNote[n].flag=allNote[n].flag;
                                newDatass.allNote[n].calculate=allNote[n].calculate;
                                newDatass.allNote[n].paidAmount = allNote[n].paidAmount;
                                newDatass.allNote[n]._id=allNote[n]._id;
                            }
                        }
                        models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema).findByIdAndUpdate(_id, {$set: newDatass}, {new: true}, function (err, result) {
                            res.send(200,{success: ' success', result: result, id: result._id});
                        });
                    }

                }
            })
    }

    this.calculateRoyalty=function (req, res, next,accountArray) {
        var data=req.body;
        var buildingId=data.sourceDocument._id;
        var amount=0;
        var buildingContract = models.get(req.session.lastDb, 'buildingContract', buildingContractSchema);
        var projectRoyalty = models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema);
        var newData={};
        var persons=[];
        var royalties=[];
        var newRoyalty={};
        for(var m=0;m<accountArray.length;m++){
            amount=amount+accountArray[m].debit;
        }
        buildingContract
            .aggregate([
                {
                    $match:{
                        projectName:objectId(buildingId)
                    }
                },
                {
                    $project:{
                        _id:1,
                        clerk1                      : 1,
                        clerk2                      : 1,
                        clerk3                      : 1,
                        merchandiser1               : 1,
                        merchandiser2               : 1,
                        merchandiser3               : 1,
                        clerkRate1                  : 1,
                        clerkRate2                  : 1,
                        clerkRate3                  : 1,
                        merchandiserRate1           : 1,
                        merchandiserRate2           : 1,
                        merchandiserRate3           : 1
                    }
                }
            ],function (err,result) {
                var buildingContractId=result[0]._id;
                projectRoyalty
                    .aggregate([
                        {
                            $match: {
                                buildingProject          : objectId(buildingContractId)
                            }
                        },
                        {
                            $project: {
                                _id                         : 1,
                                persons                     : 1,
                                royalties                   : 1
                            }
                        }

                    ],function (err,royalty) {
                        if(royalty.length>0) {
                            var _id=royalty[0]._id;
                            persons=royalty[0].persons;
                            royalties=royalty[0].royalties;
                            newRoyalty={};
                            newRoyalty.details=[];

                            for(var a=0;a<persons.length;a++){
                                var per={};
                                persons[a].basic=persons[a].basic*1+amount*persons[a].rate/100;
                                per.name=persons[a].name;
                                per.basic=amount*persons[a].rate/100;
                                newRoyalty.details.push(per);
                            }
                            newRoyalty.payment={};
                            newRoyalty.payment.paidAmount=amount;
                            newRoyalty.payment.date=data.date;
                            royalties.push(newRoyalty);
                            newData={
                                persons:persons,
                                royalties:royalties
                            };

                            models.get(req.session.lastDb, 'projectRoyalty', projectRoyaltySchema).findByIdAndUpdate(_id, {$set: newData}, {new: true}, function (err, result) {

                                res.send(200,{success: 'success', result: result, id: result._id});
                            });
                        }else{
                            persons=[];
                            newData={};
                            var person={};
                            if(result[0].clerk1){
                                person={};
                                person.name=result[0].clerk1;
                                person.rate=result[0].clerkRate1;
                                person.basic=amount*result[0].clerkRate1/100;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].clerk2){
                                person={};
                                person.name=result[0].clerk2;
                                person.rate=result[0].clerkRate2;
                                person.basic=amount*result[0].clerkRate2/100;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].clerk3){
                                person={};
                                person.name=result[0].clerk3;
                                person.rate=result[0].clerkRate3;
                                person.basic=amount*result[0].clerkRate3/100;
                                person.type='业务员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser1){
                                person={};
                                person.name=result[0].merchandiser1;
                                person.rate=result[0].merchandiserRate1;
                                person.basic=amount*result[0].merchandiserRate1/100;
                                person.type='跟单员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser2){
                                person={};
                                person.name=result[0].merchandiser2;
                                person.rate=result[0].merchandiserRate2;
                                person.basic=amount*result[0].merchandiserRate2/100;
                                person.type='跟单员';
                                persons.push(person);
                            }
                            if(result[0].merchandiser3){
                                person={};
                                person.name=result[0].merchandiser3;
                                person.rate=result[0].merchandiserRate3;
                                person.basic=amount*result[0].merchandiserRate3/100;
                                person.type='跟单员';
                                persons.push(person);
                            }

                            royalties=[];
                            newRoyalty={};
                            newRoyalty.payment={};
                            newRoyalty.payment.paidAmount=amount;
                            newRoyalty.payment.date=data.date;


                            newRoyalty.details=[];
                            for(var n=0;n<persons.length;n++){
                                var peo={};
                                peo.name=persons[n].name;
                                peo.basic=persons[n].basic;
                                newRoyalty.details.push(peo);
                            }

                            newData.persons=persons;
                            newData.royalties=newRoyalty;
                            newData.createdBy = {
                                date: new Date(),
                                user: req.session.uId
                            };

                            newData.buildingProject=buildingContractId;
                            var newProjectRoyalty;
                            newProjectRoyalty = new projectRoyalty(newData);
                            newProjectRoyalty.save(function (err, result) {
                                if (err) {
                                    return next(err);
                                }
                                res.status(201).send({success: 'success',id: result._id});
                            });
                        }
                    })
            });
    }

};

module.exports = Module;