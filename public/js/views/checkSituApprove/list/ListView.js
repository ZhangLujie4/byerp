define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/checkSituApprove/list/ListHeader.html',
    'views/checkSituApprove/EditView',
    'views/checkSituApprove/list/ListItemView',
    'collections/checkSituApprove/filterCollection',
    'dataService'
], function ($, _, ListViewBase, listTemplate, EditView, ListItemView, ContentCollection, dataService) {
    'use strict';

    var checkSituApproveListView = ListViewBase.extend({
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'checkSituApprove', // needs in view.prototype.changeLocationHash

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
            console.log(id);
            dataService.getData('/engineerInfo/checkSituation', {id: id}, function(response){
                return new EditView({
                    model        : response,
                });
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

    return checkSituApproveListView;
});
