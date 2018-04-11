define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/vacationDashboard/TopBarTemplate.html',
    'moment',
    'custom',
    'constants'
], function (Backbone, $, _, ContentTopBarTemplate, moment, custom, CONSTANTS) {
    'use strict';
    var TopBarView = Backbone.View.extend({
        el         : '#top-bar',
        contentType: 'DashBoardVacation',
        template   : _.template(ContentTopBarTemplate),

        events: {
            'click #updateDate': 'changeDateRange',
            'click .dateRange' : 'toggleDateRange',
            'click #cancelBtn' : 'cancel'
        },

        cancel: function (e) {
            var targetEl = $(e.target);
            var ul = targetEl.closest('ul.frameDetail');

            ul.addClass('hidden');
        },

        changeDateRange: function (e) {
            var targetEl = $(e.target);
            var dateFilter = targetEl.closest('ul.dateFilter');
            var startDate = dateFilter.find('#startDate');
            var endDate = dateFilter.find('#endDate');
            var startTime = dateFilter.find('#startTime');
            var endTime = dateFilter.find('#endTime');

            startDate = startDate.val();
            endDate = endDate.val();

            startTime.text(startDate);
            endTime.text(endDate);

            custom.cacheToApp('vacationDashDateRange', {
                startDate: startDate,
                endDate  : endDate
            });

            this.trigger('changeDateRange');
            this.toggleDateRange(e);
        },

        toggleDateRange: function (e) {
            var targetEl = $(e.target);
            var ul = targetEl.closest('ul');

            if (!ul.hasClass('frameDetail')) {
                ul.find('.frameDetail').toggleClass('hidden');
            } else {
                ul.toggleClass('hidden');
            }
        },

        initialize: function (options) {
            if (options && options.collection) {
                this.collection = options.collection;
            }

            this.render();
        },

        bindDataPickers: function (startDate, endDate) {
            var self = this;

            this.$el.find('#startDate')
                .datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    defaultDate: startDate,
                    onSelect   : function () {
                        var targetInput = $(this);
                        var endDatePicker = self.$endDate;
                        var endDateVal = moment(targetInput.datepicker('getDate'));

                        endDateVal.add(CONSTANTS.DASH_VAC_RANGE_WEEKS_MIN, 'week').day('Monday');
                        endDateVal = endDateVal.toDate();

                        endDatePicker.datepicker('option', 'minDate', endDateVal);

                        return false;
                    }
                })
                .datepicker('setDate', startDate);
            this.$endDate = this.$el.find('#endDate')
                .datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    defaultDate: endDate
                })
                .datepicker('setDate', endDate);
        },

        hideDateRange: function () {
            var targetEl = this.$el.find('.frameDetail');

            targetEl.addClass('hidden');
        },

        render: function () {
            var dateRange = custom.retriveFromCash('vacationDashDateRange') || {};
            var startDate = dateRange.startDate || moment().subtract(CONSTANTS.DASH_VAC_WEEK_BEFORE, 'week').day('Monday').format('DD MMM, YYYY');
            var endDate = dateRange.endDate || moment().add(CONSTANTS.DASH_VAC_WEEK_AFTER, 'week').day('Sunday').format('DD MMM, YYYY');
            var viewType = custom.getCurrentVT();

            $('title').text(this.contentType);

            if (viewType && viewType === 'tform') {
                this.$el.addClass('position');
            } else {
                this.$el.removeClass('position');
            }

            this.$el.html(this.template({
                contentType: this.contentType,
                startDate  : startDate,
                endDate    : endDate
            }));

            this.bindDataPickers(startDate, endDate);

            custom.cacheToApp('vacationDashDateRange', {
                startDate: startDate,
                endDate  : endDate
            });

            return this;
        }
    });

    return TopBarView;
});
