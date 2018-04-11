define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/designInvoice/CreateTemplate.html',
    'models/designInvoiceModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, InvoiceModel, common, populate, AttachView, SelectView, CONSTANTS,dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'designInvoice',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'                    : 'showDatePicker'
        },


        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new InvoiceModel();
            this.responseObj['#type'] = [
                {
                    _id : 'invoice',
                    name: '发票'
                }, {
                    _id : 'receive',
                    name: '收据'
                }
            ];

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
            var invoiceDate = $.trim(this.$el.find('#invoiceDate').val());
            var amount = $.trim(this.$el.find('#amount').val());
            var name = $.trim(this.$el.find('#name').val());
            var project = $.trim(this.$el.find('#project').data('id'));
            var department = $.trim(this.$el.find('#department').data('id'));
            var payer = $.trim(this.$el.find('#payer').data('id'));
            var realPayer = $.trim(this.$el.find('#realPayer').data('id'));
            var type = $.trim(this.$el.find('#type').data('id'));

           this.model.save(
                {
                    note:note,
                    invoiceDate:invoiceDate,
                    amount:amount,
                    name:name,
                    payer:payer,
                    project:project,
                    realPayer:realPayer,
                    type:type,
                    department:department
                },
                {
                    patch  : true,
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
            populate.get('#project', '/DesignProjects/getForDd', {}, 'name', this, false, false);
            populate.get('#department', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, false, false);
            dataService.getData( CONSTANTS.URLS.ENTERPRISE_GETFORDD, {
            }, function (response, context) {
                self.responseObj['#payer']=response;

            });
            dataService.getData( CONSTANTS.URLS.ENTERPRISE_GETFORDD, {
            }, function (response, context) {
                self.responseObj['#realPayer']=response;

            });
            this.$el.find('#invoiceDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            }).datepicker('setDate', new Date());

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
