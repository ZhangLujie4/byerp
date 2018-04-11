define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/shippingPlan/TopBarTemplate.html',
    'custom',
    'constants',
    'common'
], function (_, BaseView, ContentTopBarTemplate, Custom, CONSTANTS, common) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.SHIPPINGPLAN,
        contentHeader: '审核出库',
        template     : _.template(ContentTopBarTemplate),
        events: {
            'click #updateDate': 'changeDateRange',
            'click .dateRange' : 'toggleDateRange',
            'click #cancelBtn' : 'cancel',
        },

        cancel: function (e) {
            var targetEl = $(e.target);
            var ul = targetEl.closest('ul.frameDetail');

            ul.addClass('hidden');
        },

        changeDateRange: function (e) {
            var dateRange = Custom.retriveFromCash('shippingPlanDateRange');
            var targetEl = $(e.target);
            var dateFilter = targetEl.closest('ul.dateFilter');
            var startDate = dateFilter.find('#startDate');
            var startTime = dateFilter.find('#startTime');
            var endDate = dateFilter.find('#endDate');
            var endTime = dateFilter.find('#endTime');
            var type = dateRange.type;
            startDate = startDate.val();
            endDate = endDate.val();

            startTime.text(startDate);
            endTime.text(endDate);

            Custom.cacheToApp('shippingPlanDateRange', {
                startDate: startDate,
                endDate: endDate
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

                })
                .datepicker('setDate', startDate);

            this.$el.find('#endDate')
                .datepicker({
                    dateFormat : 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    defaultDate: startDate,       
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],

                })
                .datepicker('setDate', endDate);

        },

        render: function () {
            var dateRange = Custom.retriveFromCash('shippingPlanDateRange');
            var viewType = Custom.getCurrentVT();

            $('title').text(this.contentType);

            this.startDate = common.utcDateToLocaleDate(dateRange.startDate);
            this.endDate = common.utcDateToLocaleDate(dateRange.endDate);

            this.$el.html(this.template({
                viewType   : viewType,
                contentType: this.contentType,
                startDate  : this.startDate,
                endDate    : this.endDate
            }));

            this.bindDataPickers(this.startDate, this.endDate);

            return this;
        }
    });

    return TopBarView;
});
