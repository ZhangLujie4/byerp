define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/managementRule/list/ListHeader.html',
    'views/managementRule/CreateView',
    'views/managementRule/EditView',
    'views/managementRule/list/ListItemView',
    'views/Filter/filterView',
    'collections/managementRule/filterCollection',
    'dataService'
], function ($, _, ListViewBase, listTemplate, CreateView, EditView, ListItemView, FilterView, ContentCollection, dataService) {
    'use strict';

    var managementRuleListView = ListViewBase.extend({
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'managementRule', // needs in view.prototype.changeLocationHash
        FilterView       : FilterView,

        events:  {
            'click  .list tbody td:not(.notForm, .validated)': 'goToEditDialog',
        },

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.page = options.collection.currentPage;
            this.sort = options.sort;
            this.contentCollection = ContentCollection;

            ListViewBase.prototype.initialize.call(this, options);
        },

        goToEditDialog: function(e){
            var self = this;
            var modelId = $(e.target).closest('tr').attr('data-id');
            var model = self.collection.get(modelId);

            e.preventDefault();

            return new EditView({
                eventChannel: self.eventChannel,
                model       : model,
                type        : self.contentType
            });
        },

        render: function () {
            var $currentEl;

            $('.ui-dialog ').remove();

            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());

            this.renderPagination($currentEl, this);

            $currentEl.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return managementRuleListView;
});
