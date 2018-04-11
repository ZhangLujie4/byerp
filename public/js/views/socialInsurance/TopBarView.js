define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/socialInsurance/TopBarTemplate.html',
    'custom',
    'common',
    'MonthPicker'
], function (_, BaseView, TopBarTemplate, Custom, common, MonthPicker) {
    'use strict';
    var TopBarView = BaseView.extend({
        el              : '#top-bar',
        contentType     : 'socialInsurance',
        collectionLength: 0,
        template        : _.template(TopBarTemplate),
        events: {
            'click #top-bar-importBtn' : 'importEvent',
            'click #updateDate': 'changeDateRange',
            'click .dateRange' : 'toggleDateRange',
            'click #cancelBtn' : 'cancel'
        },

        initialize: function (options) {
            if (options.collection) {
                this.collection = options.collection;
            }

            this.render();
        },

        importEvent: function(options){
            event.preventDefault();

            this.trigger('importEvent');
        },

        cancel: function (e) {
            var targetEl = $(e.target);
            var ul = targetEl.closest('ul.frameDetail');

            ul.addClass('hidden');
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

        changeDateRange: function (e) {
            var targetEl = $(e.target);
            var dateFilter = targetEl.closest('ul.dateFilter');
            var startDate = dateFilter.find('#startDate');
            var startTime = dateFilter.find('#startTime');

            startDate = startDate.val();

            startTime.text(startDate);

            Custom.cacheToApp('socialInsuranceDateRange', {
                startDate: startDate,
            });

            this.trigger('changeDateRange');
            this.toggleDateRange(e);
        },

        hideDateRange: function () {
            var targetEl = this.$el.find('.frameDetail');

            targetEl.addClass('hidden');
        },

        bindDataPickers: function (startDate) {
            var self = this;

            this.$el.find('#startDate').MonthPicker({
                Button: false,
                MonthFormat: 'yy-mm',
                i18n: {
                    year: "年份",
		    months : ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                    prevYear: "上一年",
                    nextYear: "下一年",
                    jumpYears: "选择年份",
                    backTo  : "返回",
                }
            });
        },

        render: function () {
            var dateRange = Custom.retriveFromCash('socialInsuranceDateRange');
            var viewType = Custom.getCurrentVT();

            $('title').text(this.contentType);

            this.startDate = common.utcDateToLocaleDate(dateRange.startDate);

            this.$el.html(this.template({
                viewType   : viewType,
                contentType: this.contentType,
                startDate  : this.startDate,
                //endDate    : this.endDate
            }));

            this.bindDataPickers(this.startDate);

            return this;
        }
    });

    return TopBarView;
});
