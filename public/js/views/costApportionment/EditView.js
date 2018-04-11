define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/costApportionment/EditTemplate.html',
    'moment',
    'views/costApportionment/detailView'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             moment,
             detailView
           ) {

    var EditView = ParentView.extend({
        contentType: 'costApportionment',
        template   : _.template(EditTemplate),
        events: {
            'click td.metalPlateOutput'                                                                : 'getDetails',
            'click td.rawMaterialCosting'                                                              : 'getDetails',
            'click td.processingCost'                                                                  : 'getDetails',
            'click td.publicTotal'                                                                     : 'getDetails',
            'click td.sprayOutput'                                                                     : 'getDetails',
            'click td.materials'                                                                       : 'getDetails',
            'click td.shippingCost'                                                                    : 'getDetails'
        },
        responseObj: {},


        initialize: function (options) {
            _.bindAll(this, 'render');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.type=options.type;
            this.mergeList=[];
            this.render();
        },

        getDetails:function (e) {
            var id;
            var type;
            e.preventDefault();
            type=$(e.target).data('id');
            id = $(e.target).closest('tr').data('id');
            var model;
            var list=this.mergeList;
            var lists=this.mergeLists;
            if(type=='materials'){
                for(var b=0;b<lists.length;b++){
                    if(id==lists[b].orderName) {
                        model = lists[b];
                    }
                }
            }else {
                for (var a = 0; a < list.length; a++) {
                    if (type == 'metalPlateOutput' && id == list[a].cgdh) {
                        model = list[a];
                    }
                    if (type == 'rawMaterialCosting' && id == list[a].noteName) {
                        model = list[a];
                    }
                    if (type == 'processingCost' && id == list[a].workCentreCode) {
                        model = list[a];
                    }
                    if (type == 'publicTotal' && id == list[a].journalId) {
                        model = list[a];
                    }
                    if (type == 'sprayOutput' && id == list[a].cgdh) {
                        model = list[a];
                    }
                    if (type == 'shippingCost' && id == list[a]._id) {

                        model = list[a];
                    }
                }
            }

            new detailView({model : model,type:type});

        },

        mergeAluList:function (list) {

            var newList=[];
            for(var a=0;a<list.length;a++){
                var detail={};
                if(!newList.length){
                    detail.cgdh=list[a].order.cgdh;
                    detail.createDate=list[a].order.createdBy.date;
                    detail.alreadyOutput=list[a].output;
                    detail.alreadyQuantity=1;
                    detail.details=[];
                    list[a].order.number=1;
                    list[a].order.area=list[a].output;
                    detail.details.push(list[a].order);
                    newList.push(detail)
                }else{
                    for(var b=0;b<newList.length;b++){
                        var already=0;
                        if(list[a].order.cgdh==newList[b].cgdh){
                            for(var c=0;c<newList[b].details.length;c++){
                                if(list[a].order._id==newList[b].details[c]._id){
                                    already=1;
                                    newList[b].alreadyOutput=newList[b].alreadyOutput+list[a].output;
                                    newList[b].alreadyQuantity=newList[b].alreadyQuantity+1;
                                    newList[b].details[c].number=newList[b].details[c].number+1;
                                    newList[b].details[c].area=newList[b].details[c].area+list[a].output;
                                    break
                                }else if(c==newList[b].details.length-1 && list[a].order._id!=newList[b].details[c]._id ){
                                    already=1;
                                    newList[b].alreadyOutput=newList[b].alreadyOutput+list[a].output;
                                    newList[b].alreadyQuantity=newList[b].alreadyQuantity+1;
                                    list[a].order.number=1;
                                    list[a].order.area=list[a].output;
                                    newList[b].details.push(list[a].order);
                                    break
                                }
                            }
                            if(already){
                                break
                            }
                        }else if(b==newList.length-1 && list[a].order.cgdh!=newList[b].cgdh && already==0){
                            var newdetail={};
                            newdetail.cgdh=list[a].order.cgdh;
                            newdetail.createDate=list[a].order.createdBy.date;
                            newdetail.alreadyOutput=list[a].output;
                            newdetail.alreadyQuantity=1;
                            newdetail.details=[];
                            list[a].order.number=1;
                            list[a].order.area=list[a].output;
                            newdetail.details.push(list[a].order);
                            newList.push(newdetail);
                            break;
                        }
                    }
                }
            }
            return newList;
        },

        /*mergeRawMaterialList:function (list) {
            var newList=[];
            var detail={};
            for(var a=0;a<list.length;a++){
                if(!newList.length){
                    detail.orderName=list[a].order.name;
                    detail.orderDate=list[a].order.orderDate;
                    detail.totalAmount=list[a].quantity*list[a].unitPrice;
                    detail.details=[];
                    detail.details.push(list[a]);
                    newList.push(detail)
                }else{
                    for(var b=0;b<newList.length;b++){
                        if(list[a].order.name==newList[b].orderName){
                            newList[b].totalAmount=newList[b].totalAmount+list[a].quantity*list[a].unitPrice;
                            newList[b].details.push(list[a]);
                            break
                        }else if(b==newList.length-1 && list[a].order.name!=newList[b].orderName){
                            var newdetail={};
                            newdetail.orderName=list[a].order.name;
                            newdetail.orderDate=list[a].order.orderDate;
                            newdetail.totalAmount=list[a].quantity*list[a].unitPrice;
                            newdetail.details=[];
                            newdetail.details.push(list[a]);
                            newList.push(newdetail);
                            break;
                        }
                    }
                }
            }
            return newList;
        },*/

        mergeProcessList:function (list) {
            var newList=[];
            var detail={};
            for(var a=0;a<list.length;a++){
                if(!newList.length){
                    detail.workCentreCode=list[a].workCentre.code;
                    detail.workCentreName=list[a].workCentre.name;
                    detail.quantity=1;
                    detail.price=list[a].price;
                    detail.details=[];
                    detail.details.push(list[a]);
                    newList.push(detail)
                }else{
                    for(var b=0;b<newList.length;b++){
                        if(list[a].workCentre.code==newList[b].workCentreCode){
                            newList[b].quantity=newList[b].quantity+1;
                            newList[b].details.push(list[a]);
                            break
                        }else if(b==newList.length-1 && list[a].workCentre.code!=newList[b].workCentreCode){
                            var newdetail={};
                            newdetail.workCentreCode=list[a].workCentre.code;
                            newdetail.workCentreName=list[a].workCentre.name;
                            newdetail.quantity=1;
                            newdetail.price=list[a].price;
                            newdetail.details=[];
                            newdetail.details.push(list[a]);
                            newList.push(newdetail);
                            break;
                        }
                    }
                }
            }
            return newList;
        },

        mergeJournalEntryList:function (list) {
            var newList=[];
            var detail={};
            for(var a=0;a<list.length;a++){
                if(!newList.length){
                    detail.journalName=list[a].journal.name;
                    detail.journalId=list[a].journal._id;
                    detail.quantity=1;
                    detail.totalAmount=list[a].debit?list[a].debit:list[a].credit;
                    detail.details=[];
                    detail.details.push(list[a]);
                    newList.push(detail)
                }else{
                    for(var b=0;b<newList.length;b++){
                        if(list[a].journal._id==newList[b].journalId){
                            newList[b].quantity=newList[b].quantity+1;
                            newList[b].totalAmount=newList[b].totalAmount+(list[a].debit?list[a].debit:list[a].credit);
                            newList[b].details.push(list[a]);
                            break
                        }else if(b==newList.length-1 && list[a].journal._id!=newList[b].journalId){
                            var newdetail={};
                            newdetail.journalName=list[a].journal.name;
                            newdetail.journalId=list[a].journal._id;
                            newdetail.quantity=1;
                            newdetail.totalAmount=list[a].debit?list[a].debit:list[a].credit;
                            newdetail.details=[];
                            newdetail.details.push(list[a]);
                            newList.push(newdetail);
                            break;
                        }
                    }
                }
            }
            return newList;
        },

        mergeMaterials:function (list) {
            var newList=[];
            for(var a=0;a<list.length;a++){
                var detail={};
                if(!newList.length){
                    detail.orderId=list[a].order.order._id;
                    detail.orderName=list[a].order.order.name;
                    detail.creationDate =list[a].order.order.creationDate;
                    detail.alreadyQuantity=list[a].quantity;
                    detail.alreadyOutput=list[a].output;
                    detail.details=[];
                    list[a].order.number=list[a].quantity;
                    list[a].order.area=list[a].output;
                    detail.details.push(list[a].order);
                    newList.push(detail)
                }else{
                    for(var b=0;b<newList.length;b++){
                        var already=0;
                        if(list[a].order.order._id==newList[b].orderId){
                            for(var c=0;c<newList[b].details.length;c++){
                                if(list[a].order._id==newList[b].details[c]._id){
                                    already=1;
                                    newList[b].alreadyOutput=newList[b].alreadyOutput+list[a].output;
                                    newList[b].alreadyQuantity=newList[b].alreadyQuantity+list[a].quantity;
                                    newList[b].details[c].number=newList[b].details[c].number+list[a].quantity;
                                    newList[b].details[c].area=newList[b].details[c].area+list[a].output;
                                    break
                                }else if(c==newList[b].details.length-1 && list[a].order._id!=newList[b].details[c]._id ){
                                    already=1;
                                    newList[b].alreadyOutput=newList[b].alreadyOutput+list[a].output;
                                    newList[b].alreadyQuantity=newList[b].alreadyQuantity+list[a].quantity;
                                    list[a].order.number=list[a].quantity;
                                    list[a].order.area=list[a].output;
                                    newList[b].details.push(list[a].order);
                                    break
                                }
                            }
                            if(already){
                                break
                            }
                        }else if(b==newList.length-1 && list[a].order.cgdh!=newList[b].cgdh){
                            var newdetail={};
                            newdetail.orderId=list[a].order.order._id;
                            newdetail.orderName=list[a].order.order.name;
                            newdetail.creationDate =list[a].order.order.creationDate;
                            newdetail.alreadyQuantity=list[a].quantity;
                            newdetail.alreadyOutput=list[a].output;
                            newdetail.details=[];
                            list[a].order.number=list[a].quantity;
                            list[a].order.area=list[a].output;
                            newdetail.details.push(list[a].order);
                            newList.push(newdetail);
                            break;
                        }
                    }
                }
            }
            return newList;
        },

        hideDialog: function () {
            $('.dialog').remove();
        },

        render: function () {
            var model=this.currentModel.toJSON();
            var aluList=model.aluList;
            var journalEntryList=model.journalEntryList;
            var orderRowList=model.orderRowList;
            var scanList=model.scanList;
            var sprayList=model.sprayList;
            var materialsList=model.materialsList;
            var shippingList=model.shippingCosting.details;
            var date=model.date;
            var mergeList;
            var mergeLists;
            switch (this.type) {
                case 'metalPlateOutput':
                    mergeList=this.mergeAluList(aluList);
                    break;
                case 'sprayOutput':
                    mergeList=this.mergeAluList(sprayList);
                    mergeLists=this.mergeMaterials(materialsList);
                    break;
                case 'rawMaterialCosting':
                    mergeList=orderRowList;
                    break;
                case 'processingCost':
                    mergeList=this.mergeProcessList(scanList);
                    break;
                case 'publicTotal':
                    mergeList=this.mergeJournalEntryList(journalEntryList);
                    break;
                case'shippingCost':
                    mergeList=shippingList;
                    break;
                case'sales':
                    mergeList=shippingList;
                    break;

            }


            this.mergeList=mergeList;
            this.mergeLists=mergeLists;
            var formString = this.template({
                model:model,
                aluList:mergeList,
                journalEntryList:mergeList,
                orderRowList:mergeList,
                scanList:mergeList,
                sprayList:mergeList,
                materialsList:mergeLists,
                shippingList:mergeList,
                type:this.type,
                date:date,
                moment:moment
            });

            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'dialog',
                width: 1000,
                buttons: {

                    cancel: {
                        text: '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }

                    }
                });

            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
