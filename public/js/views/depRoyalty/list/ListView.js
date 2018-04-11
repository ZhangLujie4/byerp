/**
 * Created by wmt on 2017/7/25.
 */
define([
    'jQuery',
    'Underscore',
    'text!templates/depRoyalty/list/ListHeader.html',
    'views/depRoyalty/list/ListItemView',
    'views/depRoyalty/EditView',
    'views/listViewBase',
    'views/depRoyalty/CreateView',
    'collections/depRoyalty/filterCollection',
    'dataService'
], function ($, _,
             ListHeader,
             ListItemView,
             GoEditView,
             ListViewBase,
             CreateView,
             EditView,
             ContentCollection,
             dataService
    ) {
    var ListView = ListViewBase.extend({
        ListHeader       : ListHeader,
        ListItemView     : ListItemView,
        contentType      : 'depRoyalty',
        contentCollection : ContentCollection,
        hasPagination    : true,

        events: {
            'click .listDep td:not(.notForm, .checkbox)' : 'goToEdit'
        },

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
                collection: this.collection
            });
        },

        goToEdit: function(e) {
            var tr = $(e.target).closest('tr');
            var personId = tr.attr('data-id');
            var model = this.collection.get(personId);
            return new GoEditView({
                model : model
            });
        },

        render: function () {

            var $currentEl = this.$el;
            $('.ui-dialog ').remove();

            $currentEl.html('');
            $currentEl.append(_.template(ListHeader, {collection : this.collection.toJSON()}));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());
        }
    });

    return ListView;
});
