define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/produceMonitoring/TopBarTemplate.html',
    'custom',
    'constants',
    'dataService',
    'common',
    'moment',
    'views/selectView/selectView'
], function (_, BaseView, ContentTopBarTemplate, Custom, CONSTANTS, dataService, common, moment, SelectView) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'produceMonitoring',
        template   : _.template(ContentTopBarTemplate),

        initialize: function (options) {
            if (options.collection) {
                this.collection = options.collection;
            }
            this.render();
        },

        events: {
            'click #updateDate'                 : 'changeDateRange',
            'click .dateRange'                  : 'toggleDateRange',
            'click #cancelBtn'                  : 'cancel',
            'click li.filterValues:not(#custom)': 'setDateRange',
            'click #custom'                     : 'showDatePickers',
            'click .editable'                   : 'showNewSelect'
        },

        removeAllChecked: function () {

            var filter = this.$el.find('ul.dateFilter');
            var li = filter.find('li');

            li.removeClass('checkedValue');
        },

        cancel: function (e) {

            var targetEl = $(e.target);
            var ul = targetEl.closest('ul.frameDetail');

            ul.addClass('hidden');
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
            this.startDate=startDate;
            this.endDate=endDate;
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
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                    defaultDate: startDate,
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
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                    defaultDate: endDate
                }).datepicker('setDate', endDate);
        },        

        render: function () {
            var viewType = Custom.getCurrentVT();
            var startDate = new Date(moment(new Date()).startOf('month'));
            var endDate = new Date(moment(new Date()).endOf('month'));

            this.startDate = common.utcDateToLocaleDate(new Date(startDate));
            this.endDate = common.utcDateToLocaleDate(new Date(endDate));

            $('title').text(this.contentType);

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
