define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/certificateHistory/list/ListHeader.html',
    'views/certificateHistory/list/ListItemView',
    'views/Filter/filterView',
    'models/fileManagementModel',
    'collections/certificateHistory/filterCollection',
    'collections/certificateHistory/editCollection',
    'dataService',
    'constants',
    'async',
    'moment',
    'custom'
], function (Backbone,
             $,
             _,
             ListViewBase,
             listTemplate,
             ListItemView,
             FilterView,
             CurrentModel,
             contentCollection,
             EditCollection,
             dataService,
             CONSTANTS,
             async,
             moment,
             custom) {
    'use strict';

    var certificateHistoryListView = ListViewBase.extend({
        page          : null,
        sort          : null,
        listTemplate  : listTemplate,
        ListItemView  : ListItemView,
        contentType   : 'certificateHistory', // needs in view.prototype.changeLocationHash
        changedModels : {},
        holidayId     : null,
        editCollection: null,
        FilterView    : FilterView,

        initialize: function (options) {
            $(document).off('click');
            var dateRange;
            this.CurrentModel = CurrentModel;

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;

            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.contentCollection = contentCollection;

            this.filter = options.filter || custom.retriveFromCash('certificateHistory.filter');

            if (!this.filter) {
                this.filter = {};
            }
            console.log(this.filter);
            dateRange = this.filter.date ? this.filter.date.value : [];

            if (!this.filter.date) {
                this.filter.date = {
                    type: 'date',
                    key  : 'borrowDate',
                    value: [new Date(dateRange.startDate), new Date(dateRange.endDate)]
                };
            }

            options.filter = this.filter;

            this.startDate = new Date(dateRange[0]);
            this.endDate = new Date(dateRange[1]);

            ListViewBase.prototype.initialize.call(this, options);

            custom.cacheToApp('certificateHistory.filter', this.filter);
        },

        events: {
            'click .checkbox'      : 'checked',
            'click .oe_sortable'   : 'goSort',
        },

        changeDateRange: function () {
            var itemsNumber = $('#itemsNumber').text();
            var stDate = $('#startDate').val();
            var enDate = $('#endDate').val();
            var searchObject;

            this.startDate = new Date(stDate);
            this.endDate = new Date(enDate);

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.date = {
                value: [this.startDate, this.endDate],
                type: 'date',
                key  : 'borrowDate'
            };

            searchObject = {
                page     : 1,
                startDate: stDate,
                endDate  : enDate,
                filter   : this.filter
            };

            this.collection.getFirstPage(searchObject);
            this.changeLocationHash(1, itemsNumber, this.filter);

            App.filtersObject.filter = this.filter;

            custom.cacheToApp('certificateHistory.filter', this.filter);
        },

        showFilteredPage: function (filter) {
            var itemsNumber = $('#itemsNumber').text();
            console.log(123);
            this.startTime = new Date();
            this.newCollection = false;

            this.filter = Object.keys(filter).length === 0 ? {} : filter;

            custom.cacheToApp('certificateHistory.filter', this.filter);

            this.changeLocationHash(1, itemsNumber, filter);
            this.collection.getFirstPage({
                count    : itemsNumber,
                page     : 1,
                filter   : filter,
                startDate: this.startDate,
                endDate  : this.endDate
            });
        },

        render: function () {
            var self = this;
            var $currentEl = this.$el;
            $('.ui-dialog ').remove();

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render()); // added two parameters page and items number


            this.renderPagination($currentEl, this);

            $('#top-bar-borrowBtn').hide();
            $('#top-bar-returnBtn').hide();

            App.filtersObject.filter = this.filter;
        }

    });

    return certificateHistoryListView;
});
