define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/pieceWages/TopBarTemplate.html',
    'custom',
    'constants',
    'common',
    'moment'
], function (Backbone, $, _, ContentTopBarTemplate, Custom, CONSTANTS, common, moment) {
    var TopBarView = Backbone.View.extend({
        el         : '#top-bar',
        contentType: 'PieceWages',
        template   : _.template(ContentTopBarTemplate),

        initialize: function (options) {
            if (options.collection) {
                this.collection = options.collection;
            }

            this.render();
        },

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
            var startTime = dateFilter.find('#startTime');

            startDate = startDate.val();
            startTime.text(startDate);

            Custom.cacheToApp('pieceWagesDateRange', {
                startDate: startDate,
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

        bindDataPickers: function (startDate) {
            var self = this;

            this.$el.find('#startDate')
                .datepicker({
                    dateFormat : 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    defaultDate: startDate,       
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                    dayNamesMin: ['日','一','二','三','四','五','六']
                })
                .datepicker('setDate', startDate);
        },

        render: function () {
            var dateRange = Custom.retriveFromCash('pieceWagesDateRange');
            var viewType = Custom.getCurrentVT();

            $('title').text(this.contentType);

            this.startDate = common.utcDateToLocaleDate(dateRange.startDate);

            this.$el.html(this.template({
                viewType   : viewType,
                contentType: this.contentType,
                startDate  : this.startDate,
            }));

            this.bindDataPickers(this.startDate);

            return this;
        }
    });

    return TopBarView;
});
