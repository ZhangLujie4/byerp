define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/productSurfaceTreat/list/ListHeader.html',
    'views/productSurfaceTreat/CreateView',
    'views/productSurfaceTreat/EditView',
    'views/productSurfaceTreat/list/ListItemView',
    'views/Filter/filterView',
    'collections/productSurfaceTreat/filterCollection',
    'dataService'
], function ($, _, ListViewBase, listTemplate, CreateView, EditView, ListItemView, FilterView, ContentCollection) {
    'use strict';

    var productSurfaceTreatListView = ListViewBase.extend({
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'productSurfaceTreat', // needs in view.prototype.changeLocationHash
        FilterView       : FilterView,

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.currentPage;
            this.sort = options.sort;
            this.contentCollection = ContentCollection;
            this.filter = options.filter;

            ListViewBase.prototype.initialize.call(this, options);
        },

        events: {
            'click .list tbody td:not(.notForm, .validated)'   : 'goToEditDialog',
        },

        goToEditDialog: function(e){
            var id = $(e.target).closest('tr').data('id');
            var model = this.collection.get(id);
            var self = this;
            e.preventDefault();
            return new EditView({
                model : model});
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

            // $currentEl.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return productSurfaceTreatListView;
});
