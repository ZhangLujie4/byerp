define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/listViewBase',
    'views/settingsOverview/settingsEmployee/personExternal/CreateView',
    'views/settingsOverview/settingsEmployee/personExternal/EditView',
    'views/settingsOverview/settingsEmployee/personExternal/list/ListItemView',
    'text!templates/settingsOverview/settingsEmployee/personExternal/list/ListHeader.html',
    'collections/personExternal/filterCollection',
    'common',
    'dataService',
    'constants',
    'helpers'
], function ($, _, Backbone, ListViewBase, CreateView, EditView, ListItemView, listTemplate,
             ContentCollection, common, dataService, CONSTANTS, helpers) {
    var PersonExternalListView = ListViewBase.extend({
        el               : '#personExternal',
        template         : _.template(listTemplate),
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'personExternal',
        changedModels    : {},

        events: {
            'click  .list tbody td:not(.notForm, .validated)': 'goToEditDialog',
            'click  #top-bar-createBtn'                      : 'create',
            'click  .icon-trash'                             : 'remove'
        },

        initialize: function (options) {
            var self = this;
            var eventChannel = options.eventChannel;
            self.eventChannel = eventChannel;
            self.type = this.contentType;

            self.collection = new ContentCollection({
                count: 100,
                type : this.contentType
            });

            self.collection.bind('reset', this.render, self);
        },

        create: function (e) {
            var self = this;

            e.preventDefault();

            return new CreateView({
                eventChannel     : self.eventChannel,
                updateAfterCreate: true,
                type             : self.type
            });
        },

        remove: function (e) {
            var self = this;
            var modelId = $(e.target).closest('tr').attr('data-id');
            var model;

            e.preventDefault();
            e.stopPropagation();

            if (confirm('确定要删除吗?')) {
                model = self.collection.get(modelId);
                model.destroy({
                    success: function () {
                            self.eventChannel.trigger('updatePersonExternal');               
                    }
                });
            }
        },

        goToEditDialog: function (e) {
            var self = this;
            var modelId = $(e.target).closest('tr').attr('data-id');
            var model = self.collection.get(modelId);

            e.preventDefault();

            return new EditView({
                eventChannel: self.eventChannel,
                model       : model,
                type        : self.type
            });
        },

        render: function () {
            var $currentEl;
            var itemView;
            var header = "员工额外添加项";

            $('.ui-dialog ').remove();

            $currentEl = this.$el;

            $currentEl.html('');

            $currentEl.append(_.template(listTemplate, {
                currentDb: true,
                header   : header,
                type     : this.type
            }));

            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: 1,
                type       : this.type,
                el         : '#listTable' + this.type
            });

            $currentEl.append(itemView.render());
        }

    });

    return PersonExternalListView;
});
