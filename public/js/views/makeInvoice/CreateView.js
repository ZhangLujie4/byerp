define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/makeInvoice/CreateTemplate.html',
    'models/makeInvoiceModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, makeInvoiceModel, common, populate, AttachView, SelectView, CONSTANTS,dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'makeInvoice',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
            'change #workflowNames': 'changeWorkflows',
            'click .addItem a'   : 'getItem',
            'click .removeItem'    : 'deleteRow'
        },


        initialize: function (e) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new makeInvoiceModel();

            this.render();
        },
        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },
        saveItem: function () {
            var self = this;
            var mid = 56;

            var payer = $.trim(this.$el.find('#payer').data('id'));
            var name = $.trim(this.$el.find('#name').val());
            var amount = $.trim(this.$el.find('#amount').val());
            var addValueTax = $.trim(this.$el.find('#addValueTax').val());
            var cost = $.trim(this.$el.find('#cost').val());
            var day = $.trim(this.$el.find('#day').val());
            var sell = $.trim(this.$el.find('#sell').val());
            var receive = $.trim(this.$el.find('#receive').val());
            var profit = $.trim(this.$el.find('#profit').val());
            var type = $.trim(this.$el.find("[name='type']:checked").attr('data-value'));
            var project = $.trim(this.$el.find('#project').data('id'));

            var data={
                invoice:null,
                payer:payer,
                name:name,
                amount:amount,
                addValueTax:addValueTax,
                cost:cost,
                day:day,
                sell:sell,
                receive:receive,
                profit:profit,
                type:type,
                project:project,
                dataType:'manually'
            };
            dataService.postData(CONSTANTS.URLS.MAKEINVOICE_CREATEDATA,{
                data:data
            },function (response) {
                var url = window.location.hash;

                Backbone.history.fragment = '';

                Backbone.history.navigate(url, {trigger: true});
            })


        },

        render: function () {
            var formString = this.template({
                projectName:this.projectName,
                payer:this.payer
            });
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
            dataService.getData( CONSTANTS.URLS.ENTERPRISE_GETFORDD, {
            }, function (response, context) {
                self.responseObj['#payer']=response;

            });
            populate.get('#project', '/projects/getForDd', {}, 'name', this, false, false);
            this.$el.find('#day').datepicker({
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
