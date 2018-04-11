define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/projectRoyalty/calculateBonus.html',
    'models/projectRoyaltyModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers',
    'moment',
    'dataService'
], function (Backbone, $, _, timeTemp, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers,moment,dataService) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.PROJECTROYALTY,
        template   : _.template(timeTemp),
        events     : {
            'click .addItem': 'createNewYearDueDate'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = options.model;
            this.allNote=options.note;
            this.mergeNote=options.mergeNote;

            this.payment=options.model.payment;
            this.Node=[];
            this.bonus=0;
            this.timeNode();
            this.responseObj = {};

        },

        chooseOption: function (e) {
            var $target = $(e.target);

            var holder = $target.parents('._newSelectListWrap').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        timeNode:function (e) {
            var yearDate=this.model.data.yearDueDate;
            var finishData=this.model.data.finishDueDate;
            var note=this.allNote;
            var mergeNote=this.mergeNote;
            var timeNode=[];
            var node={};
            var buildingContract=this.model.data.buildingProject;
            var noteAmount=0;
            if(buildingContract.payRate2) {
                for (var a = 0; a < note.length; a++) {
                    node={};
                    if (note[a].dueDate) {
                        node.date=note[a].dueDate;
                        node.amount=buildingContract.payRate2*note[a].totalAmount;
                        noteAmount=noteAmount+note[a].totalAmount;
                        timeNode.push(node)
                    }
                }
            }
            if(buildingContract.payRate3 || buildingContract.payRate4){
                for( var b=0;b<mergeNote.length;b++){
                    node={};
                    if(mergeNote[b].dueDate){
                        node.date=mergeNote[b].dueDate;
                        if(buildingContract.payRate3) {
                            node.amount = buildingContract.payRate3 * mergeNote[b].mergeTotalAmount;
                        }else{
                            node.amount = buildingContract.payRate4 * mergeNote[b].mergeTotalAmount;
                        }

                        timeNode.push(node)
                }
                }
            }
            if(buildingContract.payRate5) {
                var yearNode = {};
                yearNode.dates = '年底结算';
                yearNode.amount = 0;
                if(yearDate.length) {
                    for (var c = 0; c < yearDate.length; c++) {
                        node = {};
                        if (yearDate[c]) {
                            var amount = 0;
                            if (c == 0) {
                                for (var d = 0; d < note.length; d++) {
                                    if (note[d].confirmDate <= yearDate[c]) {
                                        amount = amount + note[d].totalAmount*buildingContract.payRate5;
                                    }
                                }
                            } else {
                                for (var f = 0; f < note.length; f++) {
                                    if (yearDate[c - 1] < note[f].confirmDate <= yearDate[c]) {

                                        amount = amount + note[f].totalAmount*buildingContract.payRate5;
                                    }
                                }
                            }

                            for (var p = 0; p < note.length; p++) {
                                var big = 1;
                                for (var q = 0; q < yearDate.length; q++) {
                                    if (note[p].confirmDate < yearDate[q]) {
                                        big = 0;
                                    }
                                }
                                if (big) {
                                    yearNode.amount = yearNode.amount + note[p].totalAmount*buildingContract.payRate5;
                                }
                            }
                            node.date = yearDate[c];
                            node.amount = amount ;
                            timeNode.push(node);
                        }
                    }
                }else{
                   for(var r=0;r<note.length;r++){
                       yearNode.amount = yearNode.amount + note[r].totalAmount*buildingContract.payRate5;
                   }
                }
            }
            if(buildingContract.payRate6){
                node={};
                var finishAmount=0;
                var finishNode={};
                finishNode.dates='工程完工';
                finishNode.amount=0;
                for (var g = 0; g < note.length; g++) {
                    if (note[g].dueDate) {
                        finishAmount=finishAmount+note[g].totalAmount*buildingContract.payRate6;
                    }
                }
                if(finishData){
                    node.amount=finishAmount;
                    node.date=finishData;
                    timeNode.push(node)
                }else{

                    finishNode.amount=buildingContract.payRate6*finishAmount;
                }
            }

            var newTimeNode=[];
            for(var h=0;h<timeNode.length;h++){
                var same=0;
                if(newTimeNode.length){
                    for(var i=0;i<newTimeNode.length;i++){
                        if(timeNode[h].date==newTimeNode[i].date){
                            same=1;
                            newTimeNode[i].amount= newTimeNode[i].amount*1+timeNode[h].amount*1;
                        }
                    }
                    if(same==0){
                        newTimeNode.push(timeNode[h])
                    }
                } else{

                    newTimeNode.push(timeNode[h])

                }
            }
            for(var j=0;j<newTimeNode.length-1;j++){
                for(var k=0;k<newTimeNode.length-1;k++){
                    if(newTimeNode[k].date>newTimeNode[k+1].date){
                        var mod=newTimeNode[k+1];
                        newTimeNode[k+1]=newTimeNode[k];
                        newTimeNode[k]=mod;
                    }
                }
            }

            var newTimeNodes=[];
            for(var m=0;m<newTimeNode.length;m++){
                if(newTimeNode[m].date){
                    newTimeNodes.push(newTimeNode[m])
                }
            }
            if(buildingContract.payRate5 && yearNode.amount){
                newTimeNode.push(yearNode)
            }
            if(buildingContract.payRate6 && finishNode.amount){
                newTimeNode.push(finishNode)
            }

            this.render(newTimeNode);
            this.calculateBonus(newTimeNodes);

        },

        calculateBonus:function (node) {

            var graceDay=this.model.data.graceDay;
            var bonus=0;
            var payment=this.payment;
            for(var j=0;j<payment.length-1;j++){
                for(var k=0;k<payment.length-1;k++){
                    if(payment[k].date>payment[k+1].date){
                        var mod=payment[k+1];
                        payment[k+1]=payment[k];
                        payment[k]=mod;
                    }
                }
            }

            var add=0;
            var balance={};
            balance.amount=0;
            for(var a=0;a<payment.length;a++){
                var day=0;
                if(balance.amount==0) {
                    add = add + payment[a].paidAmount;

                    var m = new Date(node[0].date) - new Date(payment[a].date);

                    day = m / 86400000;
                    if (day + graceDay * 1 < 0) {
                        day = day + graceDay * 1;
                    } else if (day < 0 && day + graceDay * 1 > 0) {
                        day = 0
                    }
                    if (add < node[0].amount) {
                        bonus = bonus + payment[a].paidAmount * day;
                    }
                    if (add >= node[0].amount) {
                        bonus = bonus + (node[0].amount - (add - payment[a].paidAmount)) * day;
                        balance.amount = add - node[0].amount;
                        balance.date = payment[a].date;
                        add = balance.amount;
                        node.splice(0, 1);

                    }
                }else{
                    if(balance.amount>=node[0].amount) {
                        for (var b = 0; b < node.length; b++) {
                            if (balance.amount >= node[0].amount) {
                                m = new Date(node[0].date) - new Date(balance.date);
                                day = m / 86400000;
                                if (day + graceDay * 1 < 0) {
                                    day = day + graceDay * 1;
                                } else if (day < 0 && day + graceDay * 1 > 0) {
                                    day = 0
                                }
                                bonus = bonus + node[0].amount * day;
                                balance.amount = balance.amount - node[0].amount;
                                add = balance.amount;
                                node.splice(0, 1);
                            } else {

                                break
                            }
                        }
                    }
                    if(0<=balance.amount<node[0].amount){
                        m= new Date(node[0].date) - new Date(balance.date);
                        day = m / 86400000;

                        if (day + graceDay * 1 < 0) {
                            day = day + graceDay * 1;
                        } else if (day < 0 && day + graceDay * 1 > 0) {
                            day = 0
                        }
                        bonus=bonus+balance.amount*day;
                        balance.amount=0;
                        m= new Date(node[0].date) - new Date(payment[a].date);
                        day = m / 86400000;

                        if (day + graceDay * 1 < 0) {
                            day = day + graceDay * 1;
                        } else if (day < 0 && day + graceDay * 1 > 0) {
                            day = 0
                        }
                        if(add+payment[a].paidAmount>node[0].amount){
                            bonus=(node[0].amount-add)*day+bonus;
                            balance.amount=add+payment[a].paidAmount-node[0].amount;
                            balance.date=payment[a].date;
                            add=balance.amount;
                            node.splice(0,1)
                        }else {
                            bonus=bonus+payment[a].paidAmount*day;
                            balance.amount=0;
                            add=add+payment[a].paidAmount;
                        }
                    }
                }
            }
            this.bonus=bonus;
        },

        saveItem: function (e) {
            var self = this;
            var data;

            var rate = $.trim(this.$el.find('#rate').val());
            if(!rate){
                return App.render({
                    type   : 'error',
                    message: '请填入银行日息!'
                })
            }
            var bonus;
            var id=this.model.data._id;
            var persons=this.model.data.persons;
            bonus=this.bonus*rate/100;
            for(var a=0;a<persons.length;a++){
                if(persons[a].type=='跟单员'){
                    persons[a].bonus=bonus
                }
            }
            data={
                persons:persons
            };

            dataService.patchData('/projectRoyalty/'+id, {
                data:data
            }, function (resp) {
                self.hideDialog();

                var url = window.location.hash;

                Backbone.history.fragment = '';

                Backbone.history.navigate(url, {trigger: true});
            });
        },

        hideDialog: function () {
            $('.dialog').remove();
        },

        render: function (node) {
            var self = this;

            var formString = this.template({model:node,moment:moment});
            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'dialog',
                width      : '600px',
                buttons    : [
                    {
                        text : '关闭',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    },
                    {
                        text : '奖罚息计算',
                        class: 'btn blue',
                        click: function () {
                            self.saveItem();
                        }
                    }]

            });



            return this;
        }
    });

    return CreateView;
});
