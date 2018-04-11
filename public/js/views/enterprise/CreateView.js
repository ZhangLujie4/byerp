define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/enterprise/CreateTemplate.html',
    'models/enterpriseModel',
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
            this.model = new AcceptModel();
            this.responseObj = {};

            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function () {
            var self = this;
            var mid = 56;

            var fullName = $.trim(this.$el.find('#fullName').val());
            var shortName = $.trim(this.$el.find('#shortName').val());
            var taxFileNumber = $.trim(this.$el.find('#taxFileNumber').val());
            var spell = $.trim(this.$el.find('#spell').val());
            var region = $.trim(this.$el.find('#region').val());
            var linkman = $.trim(this.$el.find('#linkman').val());
            var phone = $.trim(this.$el.find('#phone').val());
            var bank = $.trim(this.$el.find('#bank').val());
            var account = $.trim(this.$el.find('#account').val());


            this.model.save(
                {
                    fullName:fullName,
                    shortName:shortName,
                    taxFileNumber:taxFileNumber,
                    spell:spell,
                    region:region,
                    linkman:linkman,
                    phone:phone,
                    bank:bank,
                    account:account
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
                width        : 700,
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




            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
