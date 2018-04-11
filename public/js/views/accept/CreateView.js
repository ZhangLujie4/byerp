define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/accept/CreateTemplate.html',
    'models/acceptModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, AcceptModel, common, populate, AttachView, SelectView, CONSTANTS,dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'Tasks',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
            'change #workflowNames': 'changeWorkflows',
            'click .addItem a'   : 'getItem',
            'click .removeItem'    : 'deleteRow',
        },


        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.responseObj['#acceptType'] = [
                {
                    _id : 'company',
                    name: '公司自开'
                }, {
                    _id : 'project',
                    name: '项目部交入'
                }, {
                    _id : 'buy',
                    name: '买入'
                }
            ];
            this.model = new AcceptModel();


            this.render();
        },
        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },
        saveItem: function () {
            var self = this;
            var mid = 56;

            var note = $.trim(this.$el.find('#note').val());
            var acceptDate = $.trim(this.$el.find('#acceptDate').val());
            var amount = $.trim(this.$el.find('#amount').val());
            var acceptMan = $.trim(this.$el.find('#acceptMan').val());
            var payDepartment = $.trim(this.$el.find('#payDepartment').val());
            var Department = $.trim(this.$el.find('#Department').val());
            var endDate = $.trim(this.$el.find('#endDate').val());
            var acceptNumber = $.trim(this.$el.find('#acceptNumber').val());
            var payBank = $.trim(this.$el.find('#payBank').val());
            var receiveMan = $.trim(this.$el.find('#receiveMan').val());
            var acceptType = $.trim(this.$el.find('#acceptType').data('id'));
            if(!amount){
                return App.render({
                    type   : 'error',
                    message: '金额未填写!'
                })
            }
            if(!acceptMan){
                return App.render({
                    type   : 'error',
                    message: '出票人未填写!'
                })
            }
            if(!payDepartment){
                return App.render({
                    type   : 'error',
                    message: '付款单位未填写!'
                })
            }
            if(!Department){
                return App.render({
                    type   : 'error',
                    message: '承担部门未填写!'
                })
            }
            if(!endDate){
                return App.render({
                    type   : 'error',
                    message: '到期日期未填写!'
                })
            }
            if(!acceptNumber){
                return App.render({
                    type   : 'error',
                    message: '承兑汇票号码未填写!'
                })
            }
            if(!payBank){
                return App.render({
                    type   : 'error',
                    message: '付款行未填写!'
                })
            }
            if(!receiveMan){
                return App.render({
                    type   : 'error',
                    message: '收款人未填写!'
                })
            }
            if(!acceptType){
                return App.render({
                    type   : 'error',
                    message: '承兑类型未选择!'
                })
            }
           this.model.save(
                {
                    acceptDate:acceptDate,
                    amount:amount,
                    acceptMan:acceptMan,
                    payDepartment:payDepartment,
                    Department:Department,
                    endDate:endDate,
                    acceptNumber:acceptNumber,
                    payBank:payBank,
                    receiveMan:receiveMan,
                    note:note,
                    acceptType:acceptType
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        render: function () {
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog task-edit-dialog',
                width        : 800,
                title        : 'Create Task',
                buttons      : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }
            });

            this.$el.find('#acceptDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            }).datepicker('setDate', new Date());

            this.$el.find('#endDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });
            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
