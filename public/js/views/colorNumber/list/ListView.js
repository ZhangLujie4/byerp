define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/colorNumber/list/ListHeader.html',
    'views/colorNumber/CreateView',
    'views/colorNumber/list/ListItemView',
    'views/colorNumber/EditView',
    'models/ColorNumberModel',
    'collections/colorNumber/filterCollection',
    'views/Filter/filterView',
    'common'
], function (Backbone, $, _, ListViewBase, paginationTemplate, listTemplate, CreateView, ListItemView, EditView, CurrentModel, ContentCollection, FilterView, common) {
    var ColorNumberListView = ListViewBase.extend({

        CreateView              : CreateView,
        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'ColorNumber',

        events: {
            'click .list tbody td:not(.notForm, .validated)'                : 'goToEditDialog',
        },

        initialize: function (options) {
            $(document).off('click');
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.stages = [];
            this.sort = options.sort;
            this.filter = options.filter;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.page;
            this.contentCollection = ContentCollection;

            ListViewBase.prototype.initialize.call(this, options);
        },


        goToEditDialog: function (e) {

            var id = $(e.target).closest('tr').data('id');
            var model = this.collection.get(id);
            var self = this;
            e.preventDefault();

            return new EditView({model : model});

        },

        pushStages: function (stages) {
            this.stages = stages;
        },


        render: function () {
            var self;
            var $currentEl;
            var itemView;

            $('.ui-dialog ').remove();

            self = this;
            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            });
            
            $currentEl.append(itemView.render());

        }

    });

    return ColorNumberListView;
});
