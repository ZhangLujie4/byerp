define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/taxCategories/CreateTemplate.html',
    'models/taxCategoriesModel',
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
            var self=this;

            dataService.getData(CONSTANTS.URLS.TAXCATEGORIES_GETFORDD,{
            },function (response) {
                self.responseObj['#gist'] = response;
            });


            this.render();
        },
        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },
        saveItem: function () {
            var self = this;
            var mid = 56;

            var name = $.trim(this.$el.find('#name').val());
            var sequence = $.trim(this.$el.find('#sequence').val());
            var rate = $.trim(this.$el.find('#rate').val());
            var gist = $.trim(this.$el.find('#gist').data('id')) || null;
            var type = $.trim(this.$el.find("[name='state']:checked").attr('data-value'));



         this.model.save(
                {
                    name:name,
                    sequence:sequence,
                    rate:rate,
                    gist:gist,
                    type:type
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
                width        : 400,
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
