define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/engineerInfo/list/ListHeader.html',
    'views/engineerInfo/CreateView',
    'views/engineerInfo/list/ListItemView',
    'views/Filter/filterView',
    'models/engineerInfoModel',
    'collections/engineerInfo/filterCollection',
    'dataService',
    'constants'
], function ($, _, ListViewBase, listTemplate, CreateView, ListItemView, FilterView, CurrentModel, ContentCollection, dataService, CONSTANTS) {
    'use strict';

    var engineerInfoListView = ListViewBase.extend({
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'engineerInfo', // needs in view.prototype.changeLocationHash
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
            this.formUrl = 'easyErp/' + this.contentType + '/form/';

            ListViewBase.prototype.initialize.call(this, options);
        },

        events: {
            'click .checkbox'                                  : 'checked', 
            'click .list tbody td:not(.notForm, .validated)'   : 'gotoForm'
        },

        gotoForm: function(e){
            var id;
 
            if (!this.formUrl) {
                return;
            }
            App.ownContentType = true;
            id = $(e.target).closest('tr').attr('data-id');
            var url = this.formUrl + id;

            Backbone.history.navigate(url, {trigger: true});
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

    return engineerInfoListView;
});
