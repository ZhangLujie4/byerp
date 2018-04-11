var mongoose = require('mongoose');
var async = require('async');

var plantWorkGroup = function (models) {
    'use strict';

    var plantWorkGroupSchema = mongoose.Schemas.plantWorkGroup;
    var EmployeeSchema = mongoose.Schemas.Employee;

    this.test = function(req,res,next){
         var retObj ={};
         retObj.retStatus = 'OK';
         res.status(200).send(retObj);
    } 

    this.createWorkGroup = function(req,res,next){
        var retObj={};
        var groupMember=[];
        var members;
        var workCentre = req.body.workCentre;
        var leaderId = req.body.leader;
        var leaderWorkId = req.body.leaderWorkId;
        var memberWorkId = JSON.parse(req.body.group);
        var body = req.body;
        var db = 'CRM' || req.session.lastDb;
        var groupModel = models.get(db,'plantWorkGroup',plantWorkGroupSchema);
        var employeeModel = models.get(db,'Employees',EmployeeSchema);
        var groupId = (new Date()).valueOf();
        req.body.groupId = groupId;
        memberWorkId.push(leaderWorkId);
        employeeModel
        .find({workId:{$in:memberWorkId}})
        .select('workId name workPhones workCentre')
        .exec(function(err,memberInfo){
                if(err){
                    console.log("err",err);
                    return next(err);
                }
                
                if(memberInfo.length == memberWorkId.length){
                   async.map(memberInfo,function(each,cb){
                    groupModel
                    .find({$and:[{$or:[{leader:each._id},{members:each._id}]},{status:true}]})
                    .exec(function(err,response){

                        if(err){
                            return next (err);
                        }
                         if(!response[0]){
                            var data = each._id;
                            cb(null,data);
                        }else{
                            var data = 'exist';
                            cb(null,data);
                        }
                        
                    });
                },function(err,result){
                    if(err){
                        return next(err);
                    }

                    var mems = result.filter(function(each){
                        return each != 'exist'; 
                    });

                    if(mems.length == memberInfo.length){
                        members = mems.filter(function(item){
                            return item != leaderId;
                        });

                        var data={
                            groupId:groupId,
                            leader:leaderId,
                            members:members,
                            deledeAt:null,
                            status:true,
                            workCentre:workCentre
                        }
                        
                        var memberModel = new groupModel(data);
                        memberModel.save(function(err,result){
                            if(err){
                                return next(err);
                            }

                            retObj.retStatus='OK';
                            retObj.retValue=result;
                            res.status(200).send(retObj);
                        });
                    }else{
                        retObj.retStatus='Fail';
                        retObj.retError='重复建组';
                        res.status(200).send(retObj);
                    }
                });
               }else{
                retObj.retStatus='Fail';
                retObj.retError='not exist';
                res.status(200).send(retObj);
            }

        });
    };

    this.dismissWorkGroup = function(req,res,next){
        var retObj = {};
        var id = req.params.groupid;
        var db = 'CRM' || req.session.lastDb;
        var groupModel = models.get(db,'plantWorkGroup',plantWorkGroupSchema);
        var deleteTime = new Date();
    
         groupModel.findByIdAndUpdate(id,{$set:{status:false,deleteAt:deleteTime}},{new:true},function(err,result){
            if(err){
                return next (err);
            }

            if(!result._id){
                retObj.retStatus='Fail';
                retObj.retError='没有找到要撤销的小组';
                res.status(200).send(retObj);
            }else{
                retObj.retStatus='OK';
                retObj.retValue=result;
                res.status(200).send(retObj);
            }
         });

    }

     this.getWorkGroup = function(req,res,next){
        var retObj = {};
        var id = req.params.workid;
        var db = 'CRM' || req.session.lastDb;
        console.log("db=", db);
        var groupModel = models.get(db,'plantWorkGroup',plantWorkGroupSchema);
        var employeeModel = models.get(db, 'Employees', EmployeeSchema);
        var ids = [];

        groupModel
            .find({$and:[{$or:[{leader:id},{members:id}]},{status:true}]})
            .populate('members','_id name workPhones workId')
            .populate('leader','_id name workPhones workId')
            .exec(function(err,info){
                if(err){
                    return next(err);
                }

                if(info[0]){
                    console.log("get-info",info);
                    retObj.retStatus='OK';
                    retObj.retValue=info[0];
                    res.status(200).send(retObj);
                }else{
                    retObj.retStatus='Fail';
                    retObj.retError='没有找到小组信息';

                    res.status(200).send(retObj);
                }

            });

    };

    this.getById = function (req, res, next) {
        var response = {};
        response.data = [];
        models.get(req.session.lastDb, 'plantWorkGroup', plantWorkGroupSchema).find({}, function (err, result) {
            if (err) {
                return next(err);
            }

            response.data = result;
            res.send(response);
        });
    };
      
}

module.exports = plantWorkGroup;
