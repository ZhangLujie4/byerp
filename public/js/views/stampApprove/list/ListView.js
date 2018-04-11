define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/stampApprove/list/ListHeader.html',
    'views/stampApprove/EditView',
    'views/stampApprove/list/ListItemView',
    'models/stampApprovalModel',
    'collections/stampApprove/filterCollection',
    'dataService',
    'constants'
], function ($, _, ListViewBase, listTemplate, EditView, ListItemView, CurrentModel, ContentCollection, dataService, CONSTANTS) {
    'use strict';

    var stampApproveListView = ListViewBase.extend({
        
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'stampApprove', // needs in view.prototype.changeLocationHash

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

        events: {
            'click .checkbox'                                  : 'checked', 
            'click .list tbody td:not(.notForm, .validated)'   : 'goToEditDialog'
        },

        goToEditDialog: function(e){
            var id = $(e.target).closest('tr').data('id');
            var model = this.collection.get(id);
            var isSubmit = $(e.target).closest('tr').find('.isSubmit').data('id');
            var self = this;
            var url = this.formUrl + id;
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

            $('#top-bar-affirmBtn').hide();

            $currentEl.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return stampApproveListView;
});
