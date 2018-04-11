define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/cashDeposit/EditType1.html',
    'text!templates/cashDeposit/EditType2.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService',
    'moment'
], function (Backbone,
             _,
             $,
             ParentView,
             EditType1,
             EditType2,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS,
             dataService,
             moment) {

    var EditView = ParentView.extend({
        contentType: 'cashDeposit',
        responseObj: {},
        events: {

        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.CASHDEPOSIT;
            this.responseObj = {};
            this.responseObj['#depositType'] = [
                {
                    _id : 'cash',
                    name: '保证金'
                }, {
                    _id : 'deposit',
                    name: '押金'
                }

            ];
            this.responseObj['#paymentMethod'] = [
                {
                    _id : 'cash',
                    name: '现金'
                }, {
                    _id : 'deposit',
                    name: '银行存款'
                },
                {
                    _id : 'guarantee',
                    name: '银行保函'
                }

            ];
            this.responseObj['#flow']=[
                {
                    _id:'apply',
                    name:'已申请'
                },
                {
                    _id:'check',
                    name:'已审核'
                },
                {
                    _id:'pay',
                    name:'已支付'
                },
                {
                    _id:'return',
                    name:'退保中'
                },
                {
                    _id:'finish',
                    name:'已退保'
                }];


            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (event) {
            var self = this;

            var mid;
            var data;
            var model=this.currentModel.toJSON();



            event.preventDefault();
            mid = 39;

            var project = $.trim(this.$el.find('#project').data('id'));
            var pmr = $.trim(this.$el.find('#pmr').data('id'));
            var depositType = $.trim(this.$el.find('#depositType').data('id'));
            var paymentMethod = $.trim(this.$el.find('#paymentMethod').data('id'));
            var loanAgreement = $.trim(this.$el.find("[name='loanAgreement']:checked").attr('data-value'));
            var companyProject = $.trim(this.$el.find("[name='companyProject']:checked").attr('data-value'));

            var enterprise = $.trim(this.$el.find('#enterprise').data('id'));
            var payDate = $.trim(this.$el.find('#payDate').val());
            var cash = $.trim(this.$el.find('#cash').val());
            var unPay = $.trim(this.$el.find('#unPay').val());
            var note = $.trim(this.$el.find('#note').val());
            var amount = $.trim(this.$el.find('#amount').val());
            var projectAmount = $.trim(this.$el.find('#projectAmount').val());
            var pmrAmount = $.trim(this.$el.find('#pmrAmount').val());
            var flow=$.trim(this.$el.find('#flow').data('id'));


            if(model.type== '投标保证金'||model.type== '民工工资保证金' || model.type=='押金'|| model.type== '信誉保证金'){
                data={
                    enterprise:enterprise,
                    payDate:payDate,
                    depositType:depositType,
                    amount:amount,
                    paymentMethod:paymentMethod,
                    pmrAmount:pmrAmount,
                    note:note,
                    project:project || model.project._id,
                    companyProject:companyProject,
                    flow:flow
                }
            } else {
                data={
                    project:project || model.project._id,
                    payDate:payDate,
                    cash:cash,
                    unPay:unPay,
                    note:note,
                    pmr:pmr || model.pmr._id,
                    amount:amount,
                    projectAmount:projectAmount,
                    loanAgreement:loanAgreement,
                    flow:flow
                }
            }

            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {
                    self.hideDialog();
                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});

                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        deleteItem: function (event) {
            var mid;
            var self = this;
            var answer;

            event.preventDefault();

            mid=39;

            answer = confirm('Really DELETE items ?!');

            if (answer === true) {
                this.currentModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function (model) {

                        model = model.toJSON();

                        $("tr[data-id='" + model._id + "'] td").remove();
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                        self.hideDialog();
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            }
        },

        render: function () {

            var model=this.currentModel.toJSON();

            var formString;
            if(model.type== '投标保证金'||model.type== '民工工资保证金' || model.type=='押金'|| model.type== '信誉保证金'){

                formString = _.template(EditType2)({
                    model:model
                });
            } else {

                formString = _.template(EditType1)({
                    model:model
                });
            }


            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog  task-edit-dialog',
                width: 800,
                buttons: {
                    save: {
                        text: '保存',
                        class: 'btn blue',
                        click: self.saveItem
                    },
                    cancel: {
                        text: '取消',
                        class: 'btn',
                        click: self.hideDialog
                    },
                    delete: {
                        text: '删除',
                        class: 'btn',
                        click: self.deleteItem
                    }
                }
            });
            populate.get('#project', '/projects/getForDd', {}, 'name', this, false, false);

            populate.get2name('#pmr', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false);
            this.$el.find('#payDate').datepicker({
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
    return EditView;
});
