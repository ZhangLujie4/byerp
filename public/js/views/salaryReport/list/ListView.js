define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/salaryReport/list/ListHeader.html',
    'views/salaryReport/list/ListItemView',
    'views/salaryReport/HeadView',
    'views/Filter/filterView',
    'collections/salaryReport/filterCollection',
    'constants',
    'moment',
    'dataService',
    'helpers',
    'custom'
], function ($, _, listViewBase, listTemplate, ListItemView, HeadView, FilterView, reportCollection, CONSTANTS, moment, dataService, helpers, custom) {
    'use strict';

    var ListView = listViewBase.extend({
        el                : '#content-holder',
        defaultItemsNumber: null,
        listLength        : null,
        filter            : null,
        sort              : null,
        newCollection     : null,
        contentType       : CONSTANTS.SALARYREPORT, // needs in view.prototype.changeLocationHash
        viewType          : 'list', // needs in view.prototype.changeLocationHash
        yearElement       : null,
        FilterView        : FilterView,

        events:{
        },

        initialize: function (options) {
            var dateRange;
            var eventChannel = options.eventChannel;
            var contentType = options.type;
            self.type = contentType;
            self.eventChannel = eventChannel;
            this.startTime = options.startTime;
            this.collection = options.collection;
            _.bind(this.collection.showMore, this.collection);
            this.sort = options.sort || {};
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.page = options.collection.currentPage;
            
            dateRange = custom.retriveFromCash('salaryReportDateRange');

            this.filter = options.filter || custom.retriveFromCash('salaryReport.filter');
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

            listViewBase.prototype.initialize.call(this, options);

            this.contentCollection = reportCollection;
            custom.cacheToApp('salaryReport.filter', this.filter);
        },

        copy: function(){
            var div_print=document.getElementById("salaryReport");
            var div_print2=document.getElementById("salary-head");
            var newstr = div_print.innerHTML; 
            var newstr2 = div_print2.innerHTML;
            var oldstr = document.body.innerHTML; 
            document.body.innerHTML = newstr2+newstr; 
            window.print(); 
            document.body.innerHTML = oldstr; 
            Backbone.history.fragment = '';
            Backbone.history.navigate(window.location.hash, {trigger: true});
            return false; 
        },

        goSort: function (e) {
            var target = $(e.target).closest('th');
            var currentParrentSortClass = target.attr('class');
            var sortClass = currentParrentSortClass.split(' ')[1];
            var dataSort = target.attr('data-sort');
            var sortConst = 1;
            var collection;
            var itemView;

            if (!sortClass) {
                target.addClass('sortUp');
                sortClass = 'sortUp';
            }

            switch (sortClass) {
                case 'sortDn':
                    target.parent().find('th').removeClass('sortDn').removeClass('sortUp');
                    target.removeClass('sortDn').addClass('sortUp');
                    sortConst = 1;
                    break;
                case 'sortUp':
                    target.parent().find('th').removeClass('sortDn').removeClass('sortUp');
                    target.removeClass('sortUp').addClass('sortDn');
                    sortConst = -1;
                    break;
                // skip default;
            }

            this.collection.sortByOrder(dataSort, sortConst);

            this.$el.find('#listTable').html('');

            collection = this.collection.toJSON();

            itemView = new ListItemView({
                collection: collection,
                startDate : this.startDate,
                endDate   : this.endDate
            });

            this.$el.append(itemView.render());
        },

        changeDateRange: function () {
            var stDate = $('#startDate').val();
            var type = $.trim($('#type').find('span').text());
            var searchObject;

            this.startDate = new Date(stDate);

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.startDate = {
                key  : 'startDate',
                type: 'date',
                value: stDate
            };


            this.startKey = moment(this.startDate).year() * 100 + moment(this.startDate).month();

            searchObject = {
                page: 1,
                startDate: stDate,
                type: type,
                filter   : this.filter
            };

            this.collection.showMore(searchObject);

            App.filtersObject.filter = this.filter;

            window.location.reload(); 
                  
            custom.cacheToApp('salaryReport.filter', this.filter);
        },

        showFilteredPage: function (filter) {
            var itemsNumber = $('#itemsNumber').text();
            this.startTime = new Date();
            this.newCollection = false;

            this.filter = Object.keys(filter).length === 0 ? {} : filter;
            custom.cacheToApp('salaryReport.filter', this.filter);

            this.changeLocationHash(1, itemsNumber, filter);
            this.collection.showMore({
                count    : itemsNumber,
                page     : 1,
                filter   : filter,
                startDate: this.startDate,
                endDate  : this.endDate
            });
        },

        getMinDate: function (context) {
            dataService.getData('/employees/getYears', {}, function (response) {
                var minDate = new Date(response.min);

                $('#startDate').datepicker('option', 'minDate', minDate);
            }, context);
        },

        showMoreContent: function (newModels) {
            var $currentEl = this.$el;
            var itemView;
            var headView;
            var pagenation;
            var department = '';
            this.hideDeleteBtnAndUnSelectCheckAll();

            this.lastPage = this.collection.lastPage;
            this.startKey = moment(this.startDate).year() * 100 + moment(this.startDate).month();
            this.endKey = moment(this.endDate).year() * 100 + moment(this.endDate).month();
            this.year = moment(this.startDate).year();
            this.month = moment(this.startDate).month();
            this.page = this.collection.currentPage;

            if(this.filter.department){
                if(this.collection.toJSON()[0]){
                    if(this.collection.toJSON()[0].department){
                        department = this.collection.toJSON()[0].department.name
                    }
                }
            }

            this.$el.find('#salary-head').empty();
            headView = new HeadView({
                year: this.year,
                month: this.month,
                page: this.page,
                lastPage: this.lastPage,
                department: department
            });
            this.$el.find('#salary-head').append(headView);

            this.$el.find('#listTable').html('');

            itemView = new ListItemView({
                collection : this.collection.toJSON(),
                page       : this.collection.currentPage,
                itemsNumber: this.collection.pageSize
            });

            $currentEl.append(itemView.render());
            if (newModels.totalValue) {
                $holder.find('#totalDebit').text(helpers.currencySplitter((newModels.totalValue / 100).toFixed(2)));
            }

            itemView.undelegateEvents();

            pagenation = $currentEl.find('.pagination');

            if (newModels.length !== 0) {
                pagenation.show();
            } else {
                pagenation.hide();
            }

            $currentEl.find('#timeRecivingDataFromServer').remove();
            $currentEl.append('<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>');
        },

        render: function () {
            var self = this;
            var $currentEl = this.$el;
            var collection;
            var itemView;
            var headView;
            this.lastPage = this.collection.lastPage;
            this.startKey = moment(this.startDate).year() * 100 + moment(this.startDate).month();
            this.endKey = moment(this.endDate).year() * 100 + moment(this.endDate).month();
            this.year = moment(this.startDate).year();
            this.month = moment(this.startDate).month();
            this.page = this.collection.currentPage;
            collection = this.collection.toJSON();
            $currentEl.html('');
            
            console.log(collection);
            $currentEl.append(_.template(listTemplate, {
                weekSplitter: helpers.weekSplitter,
                itemsNumber : this.collection.numberToShow,
                collection: collection
            }));

            this.yearElement = $currentEl.find('#yearSelect');

            $currentEl.find('#top-bar-copy').show();

            var a = 0;
            var b = 0;
            // for(var i = 0 ; i < collection.length; i++){
            //     if(collection[i].deductions){
            //         for(var j = 0; j < collection[i].deductions.length; j++){
            //             if(collection[i].deductions[j].formula == "住房公积金"){
            //                 a = a + collection[i].deductions[j].amount;
            //             }
            //             if(collection[i].deductions[j].formula == "医疗保险"){
            //                 b = b + collection[i].deductions[j].amount;
            //             }
            //         }
            //     }
            // }
            // var colspan = this.$el.find('.deductions').getAttribute('colspan');
            // console.log(colspan);
            // if(a == 0){
            //     this.$el.find('.house').css("display","none");
            // }
            // if(b == 0){
            //     this.$el.find('.medical').css("display", "none");
            // }
            this.$el.find('#salary-head').html('');
            headView = new HeadView({
                year: this.year,
                month: this.month,
                page: this.page,
                lastPage: this.lastPage
            });
            this.$el.find('#salary-head').append(headView);

            this.$el.find('#listTable').html('');

            itemView = new ListItemView({
                collection: collection,
                startDate : this.startDate,
                endDate   : this.endDate
            });

            $currentEl.append(itemView.render());

            this.renderPagination(this.$el);
            App.filtersObject.filter = this.filter;

            this.getMinDate(this);

            return this;
        }
    });

    return ListView;
});
