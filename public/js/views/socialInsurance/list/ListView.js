define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/socialInsurance/list/ListHeader.html',
    'views/socialInsurance/CreateView',
    'views/socialInsurance/list/ListItemView',
    'views/socialInsurance/ImportView',
    'views/Filter/filterView',
    'collections/socialInsurance/filterCollection',
    'dataService',
    'custom',
    'moment',
], function ($, _, ListViewBase, listTemplate, CreateView, ListItemView, ImportView, FilterView, ContentCollection, dataService, custom, moment) {
    'use strict';

    var socialInsuranceListView = ListViewBase.extend({
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'socialInsurance', // needs in view.prototype.changeLocationHash
        FilterView       : FilterView,

        initialize: function (options) {
            var dateRange;
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.currentPage;
            this.sort = options.sort;
            this.contentCollection = ContentCollection;

            dateRange = custom.retriveFromCash('socialInsuranceDateRange');

            this.filter = options.filter || custom.retriveFromCash('socialInsurance.filter');
            if (!this.filter) {
                this.filter = {};
            }
            if (!this.filter.startDate) {
                this.filter.startDate = {
                    key  : 'startDate',
                    type : 'date',
                    value: new Date(dateRange.startDate)
                };
            }
            options.filter = this.filter;

            this.startDate = new Date(this.filter.startDate.value);
            options.startDate = this.startDate;
            console.log(options.filter);
            ListViewBase.prototype.initialize.call(this, options);

            custom.cacheToApp('socialInsurance.filter', this.filter);
        },

        importFiles: function(){
            return new ImportView({});
        },

        changeDateRange: function () {
            var stDate = $('#startDate').val();
            var searchObject;

            this.startDate = new Date(stDate);
            this.startKey = moment(this.startDate).year() * 100 + moment(this.startDate).month()+1;

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.startDate = {
                key  : 'startDate',
                type: 'date',
                value: stDate
            };

            this.filter.datekey = {
                key  : 'datekey',
                type : 'string',
                value: this.startKey
            };
            
            searchObject = {
                page: 1,
                startDate: stDate,
                filter   : this.filter,
                datekey  : this.startKey
            };

            this.collection.showMore(searchObject);

            App.filtersObject.filter = this.filter;

            custom.cacheToApp('socialInsurance.filter', this.filter);
        },

        showFilteredPage: function (filter) {
            var itemsNumber = $('#itemsNumber').text();
            this.startTime = new Date();
            this.newCollection = false;

            this.filter = Object.keys(filter).length === 0 ? {} : filter;
            custom.cacheToApp('socialInsurance.filter', this.filter);

            this.changeLocationHash(1, itemsNumber, filter);
            this.collection.showMore({
                count    : itemsNumber,
                page     : 1,
                filter   : filter,
                startDate: this.startDate,
                endDate  : this.endDate
            });
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
            App.filtersObject.filter = this.filter;

            $currentEl.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return socialInsuranceListView;
});
