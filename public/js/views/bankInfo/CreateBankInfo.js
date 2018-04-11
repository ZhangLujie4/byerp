/**
 * Created by admin on 2017/6/30.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/bankInfo/CreateBankInfoTemplate.html',
    'models/bankInfoModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, AcceptModel, common, populate, AttachView, SelectView, CONSTANTS,dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'bank',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
        },


        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new AcceptModel();
            this.id=options.bankId;

            this.render();
        },
        chooseOption: function (e) {
            var $target = $(e.target);
            var id = $target.attr('id');
            var text = $target.text();
            var $ul = $target.closest('ul');
            var $element = $ul.closest('dd').find('a');

            $element.attr('data-id', id);
            $element.text(text);

            $ul.remove();

            return false;
        },

        saveItem: function () {
            var self = this;
            var mid = 56;

            var date = $.trim(this.$el.find('#day').val());
            var debit = $.trim(this.$el.find('#debit').val()) || 0;
            var credit = $.trim(this.$el.find('#credit').val()) || 0;
            var journal=$.trim(this.$el.find('#journal').attr('data-id'));
            var account=this.id;

            this.model.save(
                {
                    date:date,
                    debit:debit,
                    credit:credit,
                    account:account,
                    journal:journal,
                    state:"未到单",
                    states:"未审核",
                    restore:'已还原'
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
                width        : 450,
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

            populate.get('#journal', '/journals/getForDd', {}, 'name', this, false, true);

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
