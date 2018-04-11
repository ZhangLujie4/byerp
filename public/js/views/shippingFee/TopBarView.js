define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/shippingFee/TopBarTemplate.html',
    'custom',
    'constants',
    'dataService',
    'common',
    'moment'
], function (_, BaseView, TopBarTemplate, Custom, CONSTANTS, dataService, common, moment) {
    'use strict';
    var TopBarView = BaseView.extend({
        contentType     : 'shippingFee',
        collectionLength: 0,
        template        : _.template(TopBarTemplate),
        events: {
            'click #updateDate'                 : 'changeDateRange',
            'click .dateRange'                  : 'toggleDateRange',
            'click #cancelBtn'                  : 'cancel',
            'click li.filterValues:not(#custom)': 'setDateRange',
            'click #custom'                     : 'showDatePickers'
        },
        initialize: function (options) {
            if (options.collection) {
                this.collection = options.collection;
            }

            this.render();
        },

      
        render: function () {
            var viewType = Custom.getCurrentVT();
            // var dateRange = Custom.retriveFromCash('journalEntryDateRange');
            var filter = Custom.retriveFromCash('shippingFee.filter');
            var dateRange = filter && filter.date ? filter.date.value : [];

            this.startDate = common.utcDateToLocaleDate(new Date(dateRange[0]));
            this.endDate = common.utcDateToLocaleDate(new Date(dateRange[1]));

            $('title').text(this.contentType);

            this.$el.html(this.template({
                viewType   : viewType,
                contentType: this.contentType,
                startDate  : this.startDate,
                endDate    : this.endDate
            }));

            this.bindDataPickers(this.startDate, this.endDate);

            return this;
        },
       
        cancel: function (e) {
            var targetEl = $(e.target);
            var ul = targetEl.closest('ul.frameDetail');

            ul.addClass('hidden');
        },
        removeAllChecked: function () {
            var filter = this.$el.find('ul.dateFilter');
            var li = filter.find('li');

            li.removeClass('checkedValue');
        },
        setDateRange: function (e) {
            var $target = $(e.target);
            var id = $target.attr('id');
            var date = moment(new Date());
            var quarter;

            var startDate;
            var endDate;

            this.$el.find('.customTime').addClass('hidden');
            this.$el.find('.buttons').addClass('hidden');

            this.removeAllChecked();


            if ($target.text() !== "Custom Dates") {
                $target.toggleClass('checkedValue');
            } else {
                $target.toggleClass('checkedArrow')
            }

            switch (id) {
                case 'thisMonth':
                    startDate = date.startOf('month');
                    endDate = moment(startDate).endOf('month');
                    break;
                case 'thisYear':
                    startDate = date.startOf('year');
                    endDate = moment(startDate).endOf('year');
                    break;
                case 'lastMonth':
                    startDate = date.subtract(1, 'month').startOf('month');
                    endDate = moment(startDate).endOf('month');
                    break;
                case 'lastQuarter':
                    quarter = date.quarter();

                    startDate = date.quarter(quarter - 1).startOf('quarter');
                    endDate = moment(startDate).endOf('quarter');
                    break;
                case 'lastYear':
                    startDate = date.subtract(1, 'year').startOf('year');
                    endDate = moment(startDate).endOf('year');
                    break;
            }

            this.$el.find('#startDate').datepicker('setDate', new Date(startDate));
            this.$el.find('#endDate').datepicker('setDate', new Date(endDate));

            this.changeDateRange();
        },

        showDatePickers: function (e) {
            var $target = $(e.target);

            this.removeAllChecked();

            if ($target.text() !== "Custom Dates") {
                $target.toggleClass('checkedValue');
            } else {
                $target.toggleClass('checkedArrow')
            }

            //$target.toggleClass('checkedValue');
            this.$el.find('.customTime').toggleClass('hidden');
            this.$el.find('.buttons').toggleClass('hidden');
        },

        changeDateRange: function (e) {
            var dateFilter = e ? $(e.target).closest('ul.dateFilter') : this.$el.find('ul.dateFilter');
            var startDate = dateFilter.find('#startDate');
            var endDate = dateFilter.find('#endDate');
            var startTime = dateFilter.find('#startTime');
            var endTime = dateFilter.find('#endTime');

            startDate = startDate.val();
            endDate = endDate.val();

            startTime.text(startDate);
            endTime.text(endDate);

            this.trigger('changeDateRange');
            this.toggleDateRange();
        },

        toggleDateRange: function (e) {
            var ul = e ? $(e.target).closest('ul') : this.$el.find('.dateFilter');

            if (!ul.hasClass('frameDetail')) {
                ul.find('.frameDetail').toggleClass('hidden');
            } else {
                ul.toggleClass('hidden');
            }
        },

        hideDateRange: function () {
            var targetEl = this.$el.find('.frameDetail');

            targetEl.addClass('hidden');
        },

        bindDataPickers: function (startDate, endDate) {
            var self = this;

            this.$el.find('#startDate')
                .datepicker({
                    dateFormat : 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    defaultDate: startDate,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                    onSelect   : function () {
                        var endDatePicker = self.$endDate;
                        var endDate;

                        endDatePicker.datepicker('option', 'minDate', $(this).val());

                        endDate = moment(new Date($(this).val())).endOf('month');
                        endDate = new Date(endDate);

                        endDatePicker.datepicker('setDate', endDate);

                        return false;
                    }
                }).datepicker('setDate', startDate);

            this.$endDate = this.$el.find('#endDate')
                .datepicker({
                    dateFormat : 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    defaultDate: endDate,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                }).datepicker('setDate', endDate);
        }

    });

    return TopBarView;
});
