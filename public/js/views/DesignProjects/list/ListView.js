define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/DesignProjects/list/ListHeader.html',
    'text!templates/stages.html',
    'views/DesignProjects/list/ListItemView',
    'models/DesignProjectsModel',
    'collections/DesignProjects/filterCollection'
], function ($, _, ListViewBase, listTemplate, stagesTamplate, ListItemView, CurrentModel, ContentCollection) {
    var ProjectsListView = ListViewBase.extend({

        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        ContentCollection: ContentCollection,
        formUrl          : '#easyErp/DesignProjects/form/',
        contentType      : 'DesignProjects',

        initialize: function (options) {
            $(document).off('click');

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.ContentCollection = ContentCollection;

            this.render();
        },

        events: {

        },


        render: function () {
            var itemView;
            var $currentEl;

            $('.ui-dialog ').remove();
            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            });

            $currentEl.append(itemView.render());

            this.renderPagination($currentEl, this);

            $currentEl.append('<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return ProjectsListView;
});
