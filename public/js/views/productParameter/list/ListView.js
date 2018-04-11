define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/productParameter/list/ListHeader.html',
    'views/productParameter/list/ListItemView',
    'views/productParameter/EditView',
    'models/ProductModel',
    'collections/productParameter/filterCollection',
    'common',
    'constants',
    'dataService'
], function (Backbone, $, _, ListViewBase, listTemplate, ListItemView, EditView, ProductModel, contentCollection, common, CONSTANTS, dataService) {
    var productParameterListView = ListViewBase.extend({
        EditView         : EditView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: contentCollection,
        contentType      : 'productParameter', // needs in view.prototype.changeLocationHash


        initialize: function (options) {

            this.collection = options.collection;
            this.formUrl = 'easyErp/productParameter/';
            //_.bind(this.collection.showMoreAlphabet, this.collection);
            this.filter = options.filter;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;

            this.deleteCounter = 0;
            this.page = options.collection.currentPage;

            // ListViewBase.prototype.initialize.call(this, options);

            this.contentCollection = contentCollection;
            this.render();
        },

        events: {
            'click .list tbody td:not(.notForm, .validated)'   : 'gotoForm'
        },

        gotoForm: function (e) {
            var id;
            if (!this.formUrl) {
                return;
            }
            App.ownContentType = true;
            id = $(e.target).closest('tr').attr('data-id');
            var url = this.formUrl + 'form/' + id;
            Backbone.history.navigate(url, {trigger: true});
        },

        hideSaveCancelBtns: function () {
            var createBtnEl = $('#top-bar-createBtn');
            var cancelBtnEl = $('#top-bar-deleteBtn');

            cancelBtnEl.hide();
            createBtnEl.hide();

            return false;
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
            this.hideSaveCancelBtns();

            $('#top-bar-parameter-createBtn').hide();
            $('#top-bar-formula').hide();
            $('#top-bar-editBtn').hide();
            $('#top-bar-deleteBtn').hide();

            this.renderPagination(this.$el);
        }
    });

    return productParameterListView;
});
