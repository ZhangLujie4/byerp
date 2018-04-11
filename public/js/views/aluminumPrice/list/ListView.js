define([
    'jQuery',
    'Underscore',
    'text!templates/aluminumPrice/list/ListHeader.html',
    'views/aluminumPrice/list/ListItemView',
    'views/listViewBase',
    'views/aluminumPrice/CreateView',
    'collections/aluminumPrice/filterCollection',
    'dataService'
], function ($, _,
             ListHeader,
             ListItemView,
             ListViewBase,
             CreateView,
             ContentCollection,
             dataService
    ) {
    var ListView = ListViewBase.extend({
        ListHeader       : ListHeader,
        ListItemView     : ListItemView,
        contentType      : 'aluminumPrice',
        contentCollection : ContentCollection,
        hasPagination    : true,

        initialize: function (options) {

            this.collection = options.collection;
            this.filter = options.filter;
            this.startTime = options.startTime;
            this.page = options.collection.currentPage;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.contentCollection = ContentCollection;

            ListViewBase.prototype.initialize.call(this, options);
        },

        createItem: function () {
            return new CreateView({
                collection : this.collection
            });
        },

        render: function () {
            var $currentEl = this.$el;

            $('.ui-dialog ').remove();

            $currentEl.html('');
            $currentEl.append(_.template(ListHeader));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());
        }
    });

    return ListView;
});
