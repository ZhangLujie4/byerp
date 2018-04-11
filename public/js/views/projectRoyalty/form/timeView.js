define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/projectRoyalty/form/timeTemp.html',
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

            this.responseObj = {};
            this.render();
        },

        createNewYearDueDate:function () {
            var newYearDueDate = document.getElementById("newYearDueDate");
            if(newYearDueDate.innerHTML=="") {
                newYearDueDate.innerHTML = " <dt> <label for='newYearDate'>新增年结截止时间:</label> </dt><dd > <div class='_inputIconWrap'> <input class='extrainfo blueback' type='text' name='newYearDueDate' id='newYearDate' value='' readonly placeholder=''/> </div> </dd>"
                this.$el.find('#newYearDate').datepicker({
                    dateFormat: 'yy-MM-dd',
                    changeMonth: true,
                    changeYear: true,
                    monthNames: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
                    monthNamesShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    dayNamesMin: ['日', '一', '二', '三', '四', '五', '六']
                });
            }else{newYearDueDate.innerHTML=""}

        },

        chooseOption: function (e) {
            var $target = $(e.target);

            var holder = $target.parents('._newSelectListWrap').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (e) {
            var self = this;
            var data;

            var graceDay = $.trim(this.$el.find('#graceDay').val());
            var finishDate = $.trim(this.$el.find('#finishDueDate').val());
            var newYearDate=$.trim(this.$el.find('#newYearDate').val());
            var id=this.model.data._id;

            var yearDueDate=this.model.data.yearDueDate;
            var yearDueDateList=[];
            for(var a=0;a<yearDueDate.length;a++){
                data=$.trim(this.$el.find('#yearDueDate'+a).val());
                yearDueDateList.push(data)
            }
            if(newYearDate){
                yearDueDateList.push(newYearDate)
            }

            data={

                yearDueDate:yearDueDateList,
                finishDueDate:finishDate
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
            var buildingContract=model.data.buildingProject;
            model.data.payRate5=buildingContract.payRate5;
            model.data.payRate6=buildingContract.payRate6;
            var formString = this.template({model:model.data,moment:moment});
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
            for(var a=0;a<model.data.yearDueDate.length;a++) {

                this.$el.find('#yearDueDate'+a).datepicker({
                    dateFormat: 'yy-MM-dd',
                    changeMonth: true,
                    changeYear: true,
                    monthNames: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
                    monthNamesShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],

                });
            }


            this.$el.find('#finishDueDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear: true,
                monthNames: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
                monthNamesShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                dayNamesMin: ['日', '一', '二', '三', '四', '五', '六']
               });


            return this;
        }
    });

    return CreateView;
});
