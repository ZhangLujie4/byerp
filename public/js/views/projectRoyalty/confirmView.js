define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/projectRoyalty/confirmTemp.html',
    'models/projectRoyaltyModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers',
    'moment',
    'dataService'
], function (Backbone, $, _, confirmTemp, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers,moment,dataService) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.PROJECTROYALTY,
        template   : _.template(confirmTemp),
        events     : {

        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = options.model;
            this.noteId = options.noteId;
            this.mergeNoteId=options.mergeNoteId;
            this.totalAmount=options.totalAmount;
            this.totalArea=options.totalArea;
            this.mergeNote=options.mergeNote;

            this.responseObj = {};
            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            var holder = $target.parents('._newSelectListWrap').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (e) {
            var self = this;
            var data;

            var confirmDate = $.trim(this.$el.find('#confirmDate').val());
            var dueDate = $.trim(this.$el.find('#dueDate').val());
            var id=this.model.data._id;
            if(this.noteId) {
                data = {
                    confirmDate: confirmDate,
                    dueDate: dueDate,
                    noteId: this.noteId,
                    totalAmount: this.totalAmount,
                    totalArea: this.totalArea,
                    mergeNote: this.mergeNote
                };
            }
            if(this.mergeNoteId){
                var note=this.mergeNote;
                var mergeNote=[];

                for(var a=0;a<note.length;a++){
                    var newMerge={};
                    newMerge._id=note[a]._id;
                    newMerge.dueDate=note[a].dueDate;
                    newMerge.note=[];
                    for(var b=0;b<note[a].note.length;b++){
                        newMerge.note.push(note[a].note[b]._id)
                    }
                    if(this.mergeNoteId==note[a]._id){
                        newMerge.dueDate=dueDate;
                    }
                    mergeNote.push(newMerge)
                }
                data={
                    mergeNote:mergeNote
                }
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

        render: function () {
            var self = this;
            var model=this.model;
            var allNote=model.data.allNote;
            var mergeNote=this.mergeNote;
            var note;

            if(this.noteId) {
                for (var i = 0; i < allNote.length; i++) {
                    if (this.noteId == allNote[i].goodsNote) {
                        note = allNote[i]

                    }
                }
            }
            if(this.mergeNoteId){
                for (var m = 0; m < mergeNote.length; m++) {
                    if (this.mergeNoteId == mergeNote[m]._id) {
                        note = mergeNote[m]
                    }
                }
            }

            var formString = this.template({model:note,moment:moment,note:this.noteId});
            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'dialog',
                width      : '400px',
                buttons    : [
                    {
                        text : '保存',
                        class: 'btn blue',
                        click: function () {
                            self.saveItem();
                        }
                    }, {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });

            this.$el.find('#confirmDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });
            this.$el.find('#dueDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']

            });
            return this;
        }
    });

    return CreateView;
});
