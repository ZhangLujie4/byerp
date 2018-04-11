define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/safetyManagement/list/ListHeader.html',
    'views/safetyManagement/CreateView',
    'views/safetyManagement/EditView',
    'views/safetyManagement/list/ListItemView',
    'views/Filter/filterView',
    'collections/safetyManagement/filterCollection',
    'dataService'
], function ($, _, ListViewBase, listTemplate, CreateView, EditView, ListItemView, FilterView, ContentCollection) {
    'use strict';

    var UsersListView = ListViewBase.extend({
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'safetyManagement', // needs in view.prototype.changeLocationHash
        //formUrl          : '#easyErp/safetyManagement/form/',
        FilterView       : FilterView,

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

            ListViewBase.prototype.initialize.call(this, options);
        },

        goToEditDialog: function(e){
            var id = $(e.target).closest('tr').data('id');
            var status = $(e.target).parent().find('.status').data('content');
            if(status == 'In Progress'){
                return App.render({
                    type   : 'error',
                    message: '正在审批中不能编辑'
                });
            }
            else{
                var model = this.collection.get(id);
                return new EditView({
                    model : model});
            }
            
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

            //$currentEl.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return UsersListView;
});
