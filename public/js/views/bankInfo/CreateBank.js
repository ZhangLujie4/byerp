define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/bankInfo/CreateBankTemplate.html',
    'models/bankModel',
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


        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');

            this.model = new AcceptModel();


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
            var thisEl = this.$el;

            var name = $.trim(this.$el.find('#name').val());
            var account = $.trim(this.$el.find('#account').val());
            var address = $.trim(this.$el.find('#address').val());
            var telephone = $.trim(this.$el.find('#telephone').val());
            var linkman = $.trim(this.$el.find('#linkman').val());
            var bankAccount=$.trim(this.$el.find('#bankAccount').attr('data-id'));

           this.model.save(
                {
                    name:name,
                    account:account,
                    address:address,
                    telephone:telephone,
                    linkman:linkman,
                    bankAccount:bankAccount
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
            populate.get('#bankAccount', '/chartOfAccount/getForDd', {}, 'name', this, false, true);
            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
