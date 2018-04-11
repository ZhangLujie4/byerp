define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/cashDeposit/CreateTemplate.html',
    'models/cashDepositModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'dataService',
    'text!templates/cashDeposit/createReturn.html',
    'moment'
], function (Backbone, $, _, ParentView, CreateTemplate, cashDepositModel, common, populate, AttachView, SelectView, CONSTANTS,dataService,createReturn,moment) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'cashDeposit',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
            'change #workflowNames': 'changeWorkflows',
            'click .addItem a'   : 'getItem',
            'click .removeItem'    : 'deleteRow'
        },


        initialize: function (e) {
            _.bindAll(this, 'saveItem', 'render','apply');
            this.model = new cashDepositModel();
            this.responseObj['#type'] = [
                {
                    _id : 'tender',
                    name: '投标保证金'
                }, {
                    _id : 'salary',
                    name: '民工工资保证金'
                }, {
                    _id : 'deposit',
                    name: '押金'
                }, {
                    _id : 'reputation',
                    name: '信誉保证金'
                }, {
                    _id : 'perform',
                    name: '履约保证金'
                }, {
                    _id : 'quality',
                    name: '质量保证金'
                }, {
                    _id : 'guarantee',
                    name: '保函保证金'
                }, {
                    _id : 'construction',
                    name: '安全文明施工保证金'
                }
            ];

            this.isReturn=e.isReturn;
            this.render();
        },

        chooseOption: function (e) {
            var self = this;
            var target = $(e.target);
            var targetElement = target.closest('a');
            var attr = targetElement.attr('id');
            var type=this.$el.find('.type');
            var project=this.$el.find('.project');
            var beneficialName=this.$el.find('.beneficialName');
            var amount=this.$el.find('.amount');
           if(attr=='number') {
               var ID=target.attr('id');

               dataService.getData( CONSTANTS.URLS.CASHDEPOSIT_GETBYID, {
                   id:ID
               }, function (response, context) {
                   switch (response.type) {
                       case 'tender':
                           response.type='投标保证金';
                           break;
                       case 'salary':
                           response.type='民工工资保证金';
                           break;
                       case 'deposit':
                           response.type='押金';
                           break;
                       case 'reputation':
                           response.type='信誉保证金';
                           break;
                       case 'perform':
                           response.type='履约保证金';
                           break;
                       case 'quality':
                           response.type='质量保证金';
                           break;
                       case 'guarantee':
                           response.type= '保函保证金';
                           break;
                       case 'construction':
                           response.type='安全文明施工保证金';
                           break;
                   }
                   type.text(response.type);
                   project.text(response.project.name);
                   beneficialName.text(response.enterprise.fullName);
                   amount.text(response.amount);


               });
           }

            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));

        },

        saveItem: function () {
            var self = this;
            var mid = 56;

            var project = $.trim(this.$el.find('#project').data('id'));
            var enterprise = $.trim(this.$el.find('#enterprise').data('id'));
            var department = $.trim(this.$el.find('#department').data('id'));
            var type = $.trim(this.$el.find('#type').data('id'));
            var returnDeposit= $.trim(this.$el.find("[name='return']:checked").attr('data-value'));

            var descriptions = $.trim(this.$el.find('#descriptions').val());
            var amount = $.trim(this.$el.find('#amount').val());
            var applyDate = $.trim(this.$el.find('#applyDate').val());
            var openDate = $.trim(this.$el.find('#openDate').val());
            var endDate = $.trim(this.$el.find('#endDate').val());
            var companyProject= $.trim(this.$el.find("[name='companyProject']:checked").attr('data-value'));


            if(!project){
                return App.render({
                    type   : 'error',
                    message: '工程未选择!'
                })
            }
            if(!enterprise){
                return App.render({
                    type   : 'error',
                    message: '受款人未选择!'
                })
            }
            if(!department){
                return App.render({
                    type   : 'error',
                    message: '部门未选择!'
                })
            }
            if(!type){
                return App.render({
                    type   : 'error',
                    message: '保证金未填选择!'
                })
            }
            if(!amount){
                return App.render({
                    type   : 'error',
                    message: '金额未填写!'
                })
            }
            if(!endDate){
                return App.render({
                    type   : 'error',
                    message: '截止日期未填写!'
                })
            }
            if(!openDate){
                return App.render({
                    type   : 'error',
                    message: '开标日期未填写!'
                })
            }
            var data = {
                project: project,
                department: department,
                type: type,
                returnDeposit: returnDeposit,
                enterprise:enterprise,
                description: descriptions,
                amount: amount,
                applyDate: applyDate,
                openDate:openDate,
                endDate:endDate,
                companyProject:companyProject
            };
            this.model.save(data,
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

        apply: function () {
            var self = this;
            var mid = 56;

            var id = $.trim(this.$el.find('#number').data('id'));
            dataService.getData( CONSTANTS.URLS.CASHDEPOSIT_RETURN, {
                id:id
            }, function (response, context) {

                var url = window.location.hash;
                Backbone.history.fragment = '';

                Backbone.history.navigate(url, {trigger: true});

            });
        },

        render: function () {
            var formString;
            var self = this;
            if(this.isReturn){

                formString =_.template(createReturn)({});
                this.$el = $(formString).dialog({
                    closeOnEscape: false,
                    dialogClass  : 'edit-dialog task-edit-dialog',
                    width        : 400,
                    title        : 'Create Task',
                    buttons      : {
                        save: {
                            text : '申请',
                            class: 'btn blue',
                            click: self.apply
                        },

                        cancel: {
                            text : '取消',
                            class: 'btn',
                            click: self.hideDialog
                        }
                    }
                });
            }else {
                formString = this.template({});
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
            }


            dataService.getData( CONSTANTS.URLS.CASHDEPOSIT_GETFORDD, {
            }, function (response, context) {

                self.responseObj['#number']=response;

            });
            dataService.getData( CONSTANTS.URLS.ENTERPRISE_GETFORDD, {
            }, function (response, context) {
                self.responseObj['#enterprise']=response;

            });
            populate.get('#department', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, false, false);
            populate.get('#project', '/projects/getForDd', {}, 'name', this, false, false);

            this.$el.find('#applyDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            }).datepicker('setDate', new Date());

            this.$el.find('#openDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

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
