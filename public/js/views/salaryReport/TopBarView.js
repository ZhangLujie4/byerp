define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/selectView/selectView',
    'text!templates/salaryReport/TopBarTemplate.html',
    'custom',
    'constants',
    'common',
    'moment',
    'dataService'
], function (Backbone, $, _, SelectView, ContentTopBarTemplate, Custom, CONSTANTS, common, moment, dataService) {
    'use strict';

    var TopBarView = Backbone.View.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.SALARYREPORT,
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
            'click #cancelBtn' : 'cancel',
            'click #top-bar-copy'  : 'copyEvent',
            'click .editable'      : 'showNewSelect',
            'click .newSelectList li:not(.miniStylePagination)'     : 'changeType',
            click                                                   : 'removeInputs'
        },

        cancel: function (e) {
            var targetEl = $(e.target);
            var ul = targetEl.closest('ul.frameDetail');

            ul.addClass('hidden');
        },

        copyEvent: function (event) {
            event.preventDefault();
            this.trigger('copyEvent');
        },

        changeDateRange: function (e) {
	    var dateRange = Custom.retriveFromCash('salaryReportDateRange');
            var targetEl = $(e.target);
            var dateFilter = targetEl.closest('ul.dateFilter');
            var startDate = dateFilter.find('#startDate');
            var startTime = dateFilter.find('#startTime');
	    var type = dateRange.type;
            startDate = startDate.val();

            startTime.text(startDate);

            Custom.cacheToApp('salaryReportDateRange', {
                startDate: startDate,
		type: type,
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
                    dayNamesMin: ['日','一','二','三','四','五','六'],

                })
                .datepicker('setDate', startDate);
        },

        showNewSelect: function (e) {
            var models;
            var $target = $(e.target);

            dataService.getData('Departments/getType', {}, function(response, context){
                    var types = [];
                    for(var i=0; i<response[0].type.length; i++){
                        var type = {
                            name: response[0].type[i],
                            _id: response[0].type[i]
                        };
                        types.push(type);
                    }
                    e.stopPropagation();

                    if (context.selectView) {
                        context.selectView.remove();
                    }

                    context.selectView = new SelectView({
                        e          : e,
                        responseObj: {'#type': types}
                    });

                    $target.append(context.selectView.render().el);
                    return false;
                }, this);

        },

        changeType: function (e) {
            var dateRange = Custom.retriveFromCash('salaryReportDateRange');
            this.startDate = common.utcDateToLocaleDate(dateRange.startDate);
            var target = $(e.target);
            var targetElement = target.closest('.editable').find('span');
            var tempClass = target.attr('class');
            var self = this;
            var redirectUrl;

            targetElement.text(target.text());
            if (target.length) {
                this.Type = target.attr('id');
            } else {
                this.$el.find('.editable').find('span').text(self.Type ? self.Type.name : '111Select');
                this.$el.find('.editable').attr('data-id', self.Type ? self.Type._id : null);
            }

            Custom.cacheToApp('salaryReportDateRange', {
                type: this.Type,
                startDate: this.startDate
            });

            this.trigger('changeDateRange');

        },

        removeInputs: function () {
            if (this.selectView) {
                this.selectView.remove();
            }
        },

        render: function () {
            var dateRange = Custom.retriveFromCash('salaryReportDateRange');
            var viewType = Custom.getCurrentVT();

            $('title').text(this.contentType);

            this.startDate = common.utcDateToLocaleDate(dateRange.startDate);
            this.type = dateRange.type;

            this.$el.html(this.template({
                viewType   : viewType,
                contentType: this.contentType,
                startDate  : this.startDate,
                type       : this.type
            }));

            this.bindDataPickers(this.startDate);

            return this;
        }
    });

    return TopBarView;
});
