define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/timeCard/list/listHeader.html',
    'text!templates/timeCard/list/listTotal.html',
    'views/timeCard/list/ListItemView',
    'views/timeCard/generate/GenerateView',
    'views/timeCard/CreateView',
    'views/Filter/filterView',
    'models/timeCardModel',
    'collections/timeCard/filterCollection',
    'common',
    'dataService',
    'populate',
    'async',
    'constants',
    'helpers/keyCodeHelper',
    'custom',
    'moment'
], function (Backbone, $, _, ListViewBase, listTemplate, listTotal, ListItemView, GenerateView, CreateView, FilterView, CurrentModel, contentCollection,  common, dataService, populate, async, CONSTANTS, keyCodes, custom, moment) {
    'use strict';

    var timeCardListView = ListViewBase.extend({
        contentType  : 'timeCard',
        viewType     : 'list',
        responseObj  : {},
        listTemplate : listTemplate,
        ListItemView : ListItemView,
        CreateView   : CreateView,
        changedModels: {},
        FilterView   : FilterView,
        monthElement      : null,
        yearElement       : null,

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
            this.contentType = 'timeCard';

            dateRange = custom.retriveFromCash('timeCardDateRange');

            this.filter = options.filter || custom.retriveFromCash('timeCard.filter');
            if (!this.filter) {
                this.filter = {};
            }

            if (!this.filter.type) {
                this.filter.type = {
                    key  : 'type',
                    type : 'string',
                    value: dateRange.type
                };
            }

            options.filter = this.filter;

            this.type = this.filter.type.value;
            options.type = this.type;
            ListViewBase.prototype.initialize.call(this, options);
            custom.cacheToApp('timeCard.filter', this.filter);
        },

        events: {
            'click .current-selected, .stageSelect'              : 'showNewSelect',
            click                                                : 'hideItemsNumber',
            'click .newSelectList li:not(.miniStylePagination)'  : 'chooseOption',
            'click .employee'                                    : 'gotoEmployee'
        },


        generate: function () {
            var keys = [];
            new GenerateView({keys: keys});
        },

        changeDateRange: function () {
            var type = $.trim($('#type').find('span').text());
            var month = this.monthElement.attr('data-content');
            var year = this.yearElement.attr('data-content');

            var searchObject;

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.type = {
                key  : 'type',
                type : 'string',
                value: type
            };

            searchObject = {
                page: 1,
                type     : type,
                month    : month,
                year     : year,
                filter   : this.filter
            };

            this.collection.showMore(searchObject);

            App.filtersObject.filter = this.filter;

            custom.cacheToApp('timeCard.filter', this.filter);
        },

        gotoEmployee: function (e) {
            var id = $(e.target).closest('tr').find('.employee').data('id');
            var url = window.location.hash + '/' + id;
            var arr = url.split('/');
            url = arr[0]+ '/' +arr[1]+ '/' + arr[2] + '/' + id;
            Backbone.history.navigate(url, {trigger: true});
        },

        chooseOption: function (e) {

            // var self = this;
            var target = $(e.target);
            var closestTD = target.closest('td');
            var targetElement = closestTD.length ? closestTD : target.closest('th').find('a');
            var tr = target.closest('tr');
            var tdTotalDays = $(tr).find('.totalDays');
            var modelId = tr.attr('data-id');
            var id = target.attr('id');
            var attr = targetElement.attr('id') || targetElement.data('content');
            var elementType = '#' + attr;
            var element = _.find(this.responseObj[elementType], function (el) {
                return el._id === id;
            });

            e.preventDefault();

            if (elementType === '#monthSelect' || elementType === '#yearSelect') {
                targetElement.text(target.text());

                targetElement.attr('data-content', target.attr('id'));
                if (elementType === '#monthSelect') {
                    this.monthElement = targetElement;
                } else {
                    this.yearElement = targetElement;
                }
                this.startTime = new Date();
                this.changedDataOptions();
                this.renderdSubHeader(this.$el);
            }

            this.hideNewSelect();

            return false;
        },

        changedDataOptions: function () {
            var month = this.monthElement.attr('data-content');
            var year = this.yearElement.attr('data-content');
            var type = $.trim($('#type').find('span').text());
            if (!this.filter) {
                this.filter = {};
            }

            this.filter.type = {
                key  : 'type',
                type : 'string',
                value: type
            };

            var searchObject = {
                month: month,
                year : year,
                type : type,
                filter: this.filter
            };

            this.changedModels = {};

            this.collection.getFirstPage(searchObject);
        },

        hideNewSelect: function () {
            var editingDates = this.$el.find('.editing');

            editingDates.each(function () {
                $(this).parent().text($(this).val());
                $(this).remove();
            });

            this.$el.find('.newSelectList').hide();

            if (this.selectView) {
                this.selectView.remove();
            }
        },

        monthForDD: function (content) {
            var array = [];
            var i;
            moment.updateLocale('en', {
                months: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
                weekdaysShort: ['日','一','二','三','四','五','六']
            })
            for (i = 0; i < 12; i++) {
                array.push({
                    _id : moment().month(i).format('M'),
                    name: moment().month(i).format('MMMM')
                });
            }

            content.responseObj['#monthSelect'] = array;

        },

        yearForDD: function (content) {
            dataService.getData('/vacation/getYears', {}, function (response, context) {
                context.responseObj['#yearSelect'] = response;
            }, content);
        },

        renderdSubHeader: function ($currentEl) {
            var subHeaderContainer;
            var month;
            var year;
            var columnContainer;
            var width;
            var date;
            var daysInMonth;
            var dateDay;
            var daysRow = '';
            var daysNumRow = '';
            var i;

            subHeaderContainer = $currentEl.find('.subHeaderHolder');

            month = this.monthElement.attr('data-content');
            year = this.yearElement.text();

            date = moment([year, month - 1, 1]);
            daysInMonth = date.daysInMonth();
            dateDay = date;

            for (i = 1; i <= daysInMonth; i++) {
                daysRow += '<th>' + dateDay.format('ddd') + '</th>';
                daysNumRow += '<th>' + i + '</th>';
                dateDay = date.add(1, 'd');
            }

            daysRow = '<tr class="subHeaderHolder borders">' + daysRow + '</tr>';

            daysNumRow = '<tr class="subHeaderHolder borders"><th class="oe_sortable" data-sort="employee.name">员工姓名</th>' +
                '<th class="oe_sortable" data-sort="department.name">部门</th>' + daysNumRow + '<th>有效天数</th><th>总天数</th></tr>';

            this.daysCount = daysInMonth;

            columnContainer = $('#columnForDays');
            width = 80 / daysInMonth;

            columnContainer.html('');

            for (i = daysInMonth; i > 0; i--) {
                columnContainer.append('<col width="' + width + '%">');
            }

            $(subHeaderContainer[0]).attr('colspan', daysInMonth - 9);
            $(subHeaderContainer[1]).replaceWith(daysRow);
            $(subHeaderContainer[2]).replaceWith(daysNumRow);
        },

        showFilteredPage: function (filter) {
            var itemsNumber = $('#itemsNumber').text();
            this.startTime = new Date();
            this.newCollection = false;

            this.filter = Object.keys(filter).length === 0 ? {} : filter;
            custom.cacheToApp('timeCard.filter', this.filter);

            this.changeLocationHash(1, itemsNumber, filter);
            this.collection.showMore({
                count    : itemsNumber,
                page     : 1,
                filter   : filter,
                startDate: this.startDate,
                endDate  : this.endDate
            });
        },

        getTotal: function (collection) {
            var self = this;
            var totalArray = new Array(this.daysCount);

            async.each(collection, function (document) {
                var i;
                for (i = self.daysCount - 1; i >= 0; i--) {
                    if(!totalArray[i]){
                        totalArray[i]=0;
                    }
                    if (document.rate[i]) {
                       totalArray[i] = document.rate[i] ? totalArray[i] += document.rate[i] : totalArray[i];
                    }

                }

            });

            return totalArray;
        },


        showMoreContent: function (newModels) {
            var holder = this.$el;
            var collection = newModels.toJSON();
            var listTotalEl;
            var itemView;

            holder.find('#listTable').empty();

            itemView = new this.ListItemView({
                collection : newModels,
                page       : this.collection.currentPage,
                itemsNumber: this.collection.pageSize
            });

            holder.append(itemView.render());

            listTotalEl = holder.find('#listTotal');

            listTotalEl.html('');
            listTotalEl.append(_.template(listTotal, {array: this.getTotal(collection)}));

            holder.find('#timeRecivingDataFromServer').remove();
            holder.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        },

        render: function () {
            var self = this;
            var $currentEl = this.$el;
            var month = {};
            var year = this.startTime.getFullYear();
            var collection = this.collection.toJSON();
            $('.ui-dialog ').remove();
            month.number = this.startTime.getMonth() + 1;
            month.name = moment(this.startTime).format('MMMM');

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate, {options: {month: month, year: year}}));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.numberToShow
            }).render()); // added two parameters page and items number

            this.monthElement = $currentEl.find('#monthSelect');
            this.yearElement = $currentEl.find('#yearSelect');
            this.renderdSubHeader($currentEl);

            var listTotalEl = this.$el.find('#listTotal');

            listTotalEl.html('');
            listTotalEl.append(_.template(listTotal, {array: this.getTotal(collection)}));
            //this.renderPagination(this.$el);
            this.monthForDD(this);
            this.yearForDD(this);
            App.filtersObject.filter = this.filter;

            return this;
        }
    });

    return timeCardListView;
});

