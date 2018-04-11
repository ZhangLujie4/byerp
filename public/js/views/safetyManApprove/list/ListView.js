define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/safetyManApprove/list/ListHeader.html',
    'views/safetyManApprove/EditView',
    'views/safetyManApprove/list/ListItemView',
    'collections/safetyManagement/filterCollection',
    'dataService'
], function ($, _, ListViewBase, listTemplate, EditView, ListItemView, ContentCollection) {
    'use strict';

    var safetyManApproveListView = ListViewBase.extend({
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'safetyManApprove', // needs in view.prototype.changeLocationHash
        //formUrl          : '#easyErp/safetyManagement/form/',

        events: {
            'click .list tbody td:not(.notForm, .validated)'   : 'goToEditDialog'
        },

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.currentPage;
            this.sort = options.sort;
            this.contentCollection = ContentCollection;

            this.render();
        },

        goToEditDialog: function(e){
            var id = $(e.target).closest('tr').data('id');
            var model = this.collection.get(id);
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

            $currentEl.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return safetyManApproveListView;
});
