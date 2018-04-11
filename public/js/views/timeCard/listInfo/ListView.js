define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/timeCard/listInfo/listHeader.html',
    'text!templates/timeCard/list/listTotal.html',
    'views/timeCard/listInfo/ListItemView',
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
], function (Backbone, $, _, ListViewBase, listTemplate, listTotal, ListItemView, FilterView, CurrentModel, contentCollection,  common, dataService, populate, async, CONSTANTS, keyCodes, custom, moment) {
    'use strict';

    var timeCardListView = ListViewBase.extend({
        contentType  : 'timeCard',
        viewType     : 'list',
        responseObj  : {},
        listTemplate : listTemplate,
        ListItemView : ListItemView,
        changedModels: {},
        FilterView   : FilterView,
        monthElement      : null,
        yearElement       : null,
        formUrl           : '#easyErp/timeCard/',

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
            this.filter = options.filter || custom.retriveFromCash('timeCard.filter');
            if (!this.filter) {
                this.filter = {};
            }
            var id = window.location.hash;
            id = id.split('/');
            this.id = id[3];
            this.year = this.startTime.getFullYear();
            options.filter = this.filter;
            ListViewBase.prototype.initialize.call(this, options);
            custom.cacheToApp('timeCard.filter', this.filter);
        },

        events: {
            'click .current-selected, .stageSelect'              : 'showNewSelect',
            click                                                : 'hideItemsNumber',
            'click .newSelectList li:not(.miniStylePagination)'  : 'chooseOption',
            'click .month'                                       : 'gotoEmployee'
        },

        gotoEmployee: function (e) {
            var month = $(e.target).closest('tr').find('.month').text();
            var employee = $(e.target).closest('tr').find('.month').data('id');
            var year = $(e.target).closest('.vacation-list').find('#yearSelect').text();
            var datekey = parseInt(year)*100+ parseInt(month);
            var id = datekey.toString() + employee;
            var url = this.formUrl + 'form/' + id;

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
            var year = this.yearElement.attr('data-content');
            var id = $('#nameSelect').data('id');
            var searchObject = {
                year : year,
                id: id
            };
            this.year = year;
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
            daysInMonth = 31;
            dateDay = date;

            for (i = 1; i <= daysInMonth; i++) {
                daysRow += '<th>' + dateDay.format('ddd') + '</th>';
                daysNumRow += '<th>' + i + '</th>';
                dateDay = date.add(1, 'd');
            }

            daysRow = '<tr class="subHeaderHolder borders">' + daysRow + '</tr>';

            daysNumRow = '<tr class="subHeaderHolder borders"><th class="oe_sortable" data-sort="employee.name">月份</th>' +
                '<th class="oe_sortable" data-sort="department.name">部门</th>' + daysNumRow + '<th>有效天数</th><th>总天数</th></tr>';

            this.daysCount = daysInMonth;

            columnContainer = $('#columnForDays');
            width = 80 / daysInMonth;

            columnContainer.html('');

            for (i = daysInMonth; i > 0; i--) {
                columnContainer.append('<col width="' + width + '%">');
            }

            $(subHeaderContainer[0]).attr('colspan', daysInMonth - 9);
            //$(subHeaderContainer[1]).replaceWith(daysRow);
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
            var totalArray = new Array(31);

            async.each(collection, function (document) {
                var i;
                for (i = 30; i >= 0; i--) {
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
            var name = this.collection.toJSON()[0] ? this.collection.toJSON()[0].name : '该年无数据';
            var id = this.id;
            var employee = {
                _id: id,
                name: name
            };
            var year = this.year;
            holder.empty();
            this.$el.append(_.template(listTemplate, {moment:moment, options: {employee: employee, year: year}}));
            itemView = new this.ListItemView({
                collection : newModels,
                page       : this.collection.currentPage,
                itemsNumber: this.collection.pageSize
            });

            holder.append(itemView.render());
            this.renderdSubHeader(holder);
            listTotalEl = holder.find('#listTotal');

            listTotalEl.html('');
            listTotalEl.append(_.template(listTotal, {array: this.getTotal(collection)}));

            holder.find('#timeRecivingDataFromServer').remove();
            holder.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        },

        render: function () {
            var self = this;
            var $currentEl = this.$el;
            var listTotalEl;
            var month = {};
            var year = this.startTime.getFullYear();
            var collection = this.collection.toJSON();
            $('.ui-dialog ').remove();
            $('.attendanceTop').remove();
            month.number = this.startTime.getMonth() + 1;
            month.name = moment(this.startTime).format('MMMM');
            var name = this.collection.toJSON()[0] ? this.collection.toJSON()[0].name : '该年无数据';
            var id = this.id;
            var employee = {
                _id: id,
                name: name
            };
            $currentEl.html('');
            $currentEl.append(_.template(listTemplate, {moment:moment, options: {employee: employee, year: year}}));
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

