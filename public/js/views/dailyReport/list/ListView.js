define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/dailyReport/list/ListHeader.html',
    'views/dailyReport/list/ListItemView',
    'views/dailyReport/CreateView',
    // 'views/dailyReport/EditView',
    'models/orderModel',
    'collections/dailyReport/filterCollection',
    'common',
    'dataService',
    'helpers',
    'constants'
], function (Backbone, $, _, ListViewBase, listTemplate, ListItemView, CreateView, dailyReportModel, contentCollection, common, dataService, helpers, CONSTANTS) {
    var dailyReportListView = ListViewBase.extend({
        CreateView: CreateView,
        // EditView: EditView,
        listTemplate: listTemplate,
        ListItemView: ListItemView,
        contentCollection: contentCollection,
        hasPagination: true,
        contentType: CONSTANTS.DAILYREPORT,

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.filter = options.filters || {};
            this.formUrl = 'easyErp/' + this.contentType + '/tform/';
            //this.forSales = false;
            this.sort = options.sort;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            //this.newCollection = options.newCollection;
            //this.deleteCounter = 0;
            this.page = options.collection.page;

            ListViewBase.prototype.initialize.call(this, options);

            this.contentCollection = contentCollection;
        },

        gotoForm: function (e) {
            var id = $(e.target).closest('tr').data('id');
            var page = this.collection.currentPage;
            var countPerPage = this.collection.pageSize;
            var url = this.formUrl + id + '/p=' + page + '/c=' + countPerPage;

            if (this.filter) {
                url += '/filter=' + encodeURI(JSON.stringify(this.filter));
            }

            if ($(e.target).closest('tfoot').length) {
                return;
            }

            App.ownContentType = true;
            Backbone.history.navigate(url, {trigger: true});
        },

        render: function () {
            var self;
            var $currentEl;
            $('.ui-dialog ').remove();

            self = this;
            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection: this.collection,
                page: this.page,
                itemsNumber: this.collection.namberToShow
            }).render()); // added two parameters page and items number

        }

    });
    return dailyReportListView;
});
