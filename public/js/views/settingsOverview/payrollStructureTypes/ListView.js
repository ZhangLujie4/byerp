define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/listViewBase',
    'text!templates/settingsOverview/settingsEmployee/payrollStructureTypes/ListTemplate.html',
    'views/settingsOverview/settingsEmployee/payrollStructureTypes/CreateView',
    'views/settingsOverview/settingsEmployee/payrollStructureTypes/EditView',
    'collections/payrollStructure/filterCollection',
    'models/PayrollStructureTypesModel'
], function ($,
             _,
             Backbone,
             listViewBase,
             ListTemplate,
             CreateView,
             EditView,
             ContentCollection,
             CurrentModel) {
    var PayrollStructureTypesListView = listViewBase.extend({
        // el               : '#structureType',
        CreateView       : CreateView,
        contentCollection: ContentCollection,
        contentType      : 'payrollStructureTypes',
        changedModels    : {},
        template         : _.template(ListTemplate),

        initialize: function (options) {
            var eventChannel = {};
            var self = this;

            this.eventChannel = options.eventsChannel;
            _.extend(eventChannel, Backbone.Events);

            self.eventChannel = eventChannel;

            self.collection = new ContentCollection({count: 100});

            self.collection.bind('reset add change', this.render, self);
        },

        events: {
            'click .goToEdit'         : 'goToEditDialog',
            'click .goToRemove'       : 'remove',
            'click #top-bar-createBtn': 'create',
            'click .toggleList'       : 'toggleList'
        },

        create: function (e) {
            e.preventDefault();

            return new CreateView({collection: this.collection, eventChannel: this.eventChannel});
        },

        toggleList: function (e) {
            e.preventDefault();

            this.$el.find('.forToggle').toggle();
        },

        remove: function (e) {
            var self = this;
            var modelId = $(e.target).closest('tr').attr('data-id');
            var model;

            e.preventDefault();
            e.stopPropagation();

            if (confirm('确定要删除此工资结构')) {
                model = self.collection.get(modelId);
                model.destroy({
                    success: function () {
                        self.$el.find('tr[data-id="' + model.id + '"]').remove();
                    }
                });
            }
        },

        goToEditDialog: function (e) {
            var self = this;
            var modelId = $(e.target).closest('tr').attr('data-id');
            var model = new CurrentModel({validate: false});

            e.preventDefault();

            model.urlRoot = '/payrollStructureTypes/' + modelId;
            model.fetch({
                success: function (response) {
                    return new EditView({
                        collection  : self.collection,
                        eventChannel: self.eventChannel,
                        model       : response
                    });
                },

                error: function () {
                    App.render({
                        type   : 'error',
                        message: '请重新刷新浏览器'
                    });
                }
            });

        },

        render: function () {
            this.$el.html(this.template({collection: this.collection.toJSON()}));

            return this;
        }

    });

    return PayrollStructureTypesListView;
});
