
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/projectRoyalty/form/FormTemplate.html',
    'text!templates/projectRoyalty/temps/documentTemp.html',
    'views/projectRoyalty/form/timeView',
    'views/dialogViewBase',
    'views/Assignees/AssigneesView',
    'common',
    'custom',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'moment',
    'text!templates/projectRoyalty/historyList.html',
    'text!templates/projectRoyalty/goodOutNote.html',
    'text!templates/projectRoyalty/mergeNote.html',
    'views/projectRoyalty/confirmView',
    'views/projectRoyalty/calculateBonus'
], function (Backbone,
             $,
             _,
             EditTemplate,
             DocumentTemplate,
             timeView,
             BaseView,
             AssigneesView,
             common,
             Custom,
             dataService,
             populate,
             CONSTANTS,
             helpers,
             moment,
             historyList,
             goodOutNote,
             mergeNote,
             confirmView,
             calculateBonus) {
    'use strict';

    var FormView = BaseView.extend({
        contentType: CONSTANTS.DESIGNROYALTY,
        imageSrc   : '',
        template   : _.template(EditTemplate),
        templateDoc: _.template(DocumentTemplate),
        templateHistory: _.template(historyList),
        templateGoodOutNote: _.template(goodOutNote),
        templateMergeNote: _.template(mergeNote),
        initialize: function (options) {
            if (options) {
                this.visible = options.visible;
                this.eventChannel = options.eventChannel;
            }

            _.bindAll(this, 'render', 'deleteItem');

            if (options.model) {
                this.currentModel = options.model;
            } else {
                this.currentModel = options.collection.getElement();
            }

            this.currentModel.urlRoot = '/projectRoyalty';
            this.mergeNote=[];
            this.allNote=[];
           // this.currentModel.on('sync', this.render, this);
            this.responseObj = {};
        },

        events: {
            'click #createPerson'                                        : 'time',
            'click .goToEdit'                                            : 'goToEdit',
            'click .goToRemove'                                          : 'goToRemove',
            'click #receive'                                             : 'createReceive',
            'click #top-bar-createBtn'                                   : 'create',
            'click td.note'                                              : 'goToNoteEdit',
            'click td.totalAmount'                                       : 'goToNoteEdit',
            'click td.totalArea'                                         : 'goToNoteEdit',
            'click #calculateBonus'                                      : 'calculateBonus',
            'click td.mergeNote'                                         : 'mergeNoteUpdate'
        },



        time: function (e) {
            return new timeView({
                model : this.currentModel
            });
        },

        calculateBonus: function (e) {
            return new calculateBonus({
                model : this.currentModel,
                note:this.allNote,
                mergeNote:this.mergeNote
            });
        },

        goToNoteEdit:function (e) {
            var target = $(e.target);
            var targetEl=target.closest('tr');
            var id;
            var totalAmount;
            var totalArea;
            id = targetEl.data('id');
            totalAmount=targetEl.find('.totalAmount').text();
            totalArea=targetEl.find('.totalArea').text();
            return new confirmView({
                model : this.currentModel,
                noteId: id,
                totalAmount:totalAmount,
                totalArea:totalArea,
                mergeNote:this.mergeNote
            });
        },

        mergeNoteUpdate:function (e) {
            var target = $(e.target);
            var targetEl=target.closest('tr');
            var id;
            id = targetEl.data('id');
            return new confirmView({
                model : this.currentModel,
                mergeNoteId: id,
                mergeNote:this.mergeNote
            });
        },

        render: function () {

            var $thisEl = this.$el;
            var model = this.currentModel;
            var formString;
            var template;
            var historyList;
            var NoteList;
            var mergeNoteList;
            var buildingContract=model.data.buildingProject;
            var building=model.building;
            var personRoyalty=model.data.persons;
            var allNote=model.data.allNote;
            var payments=model.payment;
            var receive=0;
            for(var p=0;p<payments.length;p++){
                receive=receive+payments[p].paidAmount;
            }

            model.data.payRate1=buildingContract.payRate1;
            model.data.payRate2=buildingContract.payRate2;
            model.data.payRate3=buildingContract.payRate3;
            model.data.payRate4=buildingContract.payRate4;
            model.data.payRate5=buildingContract.payRate5;
            model.data.payRate6=buildingContract.payRate6;
            model.data.areaSettle=buildingContract.areaSettle;
            model.data.amountSettle=buildingContract.amountSettle;

            formString = this.template({
                model        : model.data,
                visible      : this.visible,
                hidePrAndCust: this.hidePrAndCust
            });

            template = this.templateDoc({
                model           : model.data,
                buildingContract:buildingContract,
                building        :building[0],
                persons         :personRoyalty,
                moment          :moment,
                alreadyPay      :receive
            });
            var royalties=model.data.royalties;
            /*for(var x=0;x<royalties.length;x++) {
                for (var w = 0; w < payments.length; w++) {
                    if(royalties[x].payment==payments[w]._id){
                        royalties[x].paidAmount=payments[w].paidAmount;
                        royalties[x].date=payments[w].date;
                    }
                }
            }*/
            historyList = this.templateHistory({
                model           : royalties,
                moment:moment

            });
            var note=model.note;

            for(var m=0;m<allNote.length;m++){
                for(var n=0;n<note.length;n++){
                    var totalAmount=0;
                    var totalArea=0;
                    if(note[n]._id==allNote[m].goodsNote) {
                        note[n].paidAmount = allNote[m].paidAmount;
                        note[n].confirmDate = allNote[m].confirmDate;
                        note[n].dueDate = allNote[m].dueDate;
                        for (var k = 0; k < note[n].orderRows.length; k++) {
                            totalAmount = totalAmount + (note[n].orderRows[k].cost * note[n].orderRows[k].quantity) / 100;
                            for (var q = 0; q < note[n].orderRows[k].parameters.length; q++) {
                                if (note[n].orderRows[k].parameters[q].paraname == '面积') {
                                    totalArea = totalArea + note[n].orderRows[k].parameters[q].value*note[n].orderRows[k].quantity;
                                }
                            }

                        }
                        note[n].totalAmount = totalAmount;
                        note[n].totalArea = totalArea;
                    }
                }
            }
            this.allNote=note;

            NoteList= this.templateGoodOutNote({
                model           : note,
                moment          :moment

            });

            $thisEl.html(formString);

            $thisEl.find('#templateDiv').html(template);

            $thisEl.find('#history').html(historyList);

            $thisEl.find('#NoteList').html(NoteList);
            if(model.data.payRate3||model.data.payRate4) {
                var mergeNote=model.data.mergeNote;
                for(var r=0;r<mergeNote.length;r++){
                    var mergeTotalAmount=0;
                    var mergeTotalArea=0;
                    for(var s=0;s<mergeNote[r].note.length;s++){
                        for(var t=0;t<note.length;t++){
                            if(mergeNote[r].note[s]==note[t]._id){
                                mergeNote[r].note[s]={};
                                mergeNote[r].note[s]._id=note[t]._id;
                                mergeNote[r].note[s].name=note[t].name;
                                mergeNote[r].note[s].Amount=note[t].totalAmount;
                                mergeNote[r].note[s].Area=note[t].totalArea;
                                mergeTotalAmount=mergeTotalAmount+mergeNote[r].note[s].Amount*1;
                                mergeTotalArea=mergeTotalArea+mergeNote[r].note[s].Area*1;
                                break;
                            }
                        }
                    }
                    mergeNote[r].mergeTotalAmount=mergeTotalAmount;
                    mergeNote[r].mergeTotalArea=mergeTotalArea;
                }
                this.mergeNote=mergeNote;
                mergeNoteList=this.templateMergeNote({
                    model           : mergeNote,
                    moment          :moment

                });
                $thisEl.find('#mergeNoteList').html(mergeNoteList);
            }

            this.delegateEvents(this.events);

            App.stopPreload();

            return this;
        }
    });

    return FormView;
});
