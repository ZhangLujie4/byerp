define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/goodsBarcode/list/ListHeader.html',
    'views/goodsBarcode/CreateView',
    'views/goodsBarcode/list/ListItemView',
    'views/goodsBarcode/EditView',
    'models/GoodsBarcodeModel',
    'collections/goodsBarcode/filterCollection',
    'views/Filter/filterView',
    'dataService',
    'common'
], function (Backbone, $, _, ListViewBase, paginationTemplate, listTemplate, CreateView, ListItemView, EditView, CurrentModel, ContentCollection, FilterView, dataService, common) {
    var GoodsBarcodeListView = ListViewBase.extend({

        CreateView              : CreateView,
        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'goodsBarcode',
        // formUrl                 : "#easyErp/Tasks/form/",

        events: {
            'click .list tbody td:not(.notForm, .validated)'                : 'gotoForm',
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

        gotoForm: function (e) {
            
            var id = $(e.target).closest('tr').attr('data-id');
            var redirectUrl = '#easyErp/goodsBarcode/list/'+id;
            e.preventDefault();
            Backbone.history.navigate(redirectUrl, {trigger: true});

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
            //itemView.bind('incomingStages', this.pushStages, this);
            $currentEl.append(itemView.render());

        }

    });

    return GoodsBarcodeListView;
});
