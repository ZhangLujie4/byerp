define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/designRoyalty/CreateTemplate.html',
    'models/designRoyaltyModel',
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
            'click #deadline'      : 'showDatePicker'

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

            var project = $.trim(this.$el.find('#project').data('id'));

            this.model.save(
                {
                    project:project
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
                width        : 300,
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

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
