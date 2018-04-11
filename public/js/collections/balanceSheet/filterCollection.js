'use strict';
define([
    'Backbone',
    'models/journalEntry',
    'custom',
    'moment'
], function (Backbone, journalEntryModel, Custom, moment) {
    var gLReportCollection = Backbone.Collection.extend({

        model       : journalEntryModel,
        url         : 'journalEntries/getBalanceSheet',
        contentType : null,
        page        : null,
        numberToShow: null,
        viewType    : 'list',

        initialize: function (options) {
            options = options || {};
            this.startTime = new Date();
            this.filter = options.filter || Custom.retriveFromCash('balanceSheet.filter');
            var startDate = moment(new Date());
            var endDate = moment(new Date());

            startDate.month(startDate.month() - 1);
            startDate.date(1);
            endDate.month(startDate.month());
            endDate.endOf('month');

            var dateRange = Custom.retriveFromCash('balanceSheetDateRange') || {};
            this.startDate = dateRange.startDate;
            this.endDate = dateRange.endDate;

            this.startDate = dateRange.startDate ||  new Date(startDate);
            this.endDate = dateRange.endDate || new Date(endDate);

            options.startDate = this.startDate;
            options.endDate = this.endDate;
            options.filter = this.filter;

            Custom.cacheToApp('balanceSheetDateRange', {
                startDate: this.startDate,
                endDate  : this.endDate
            });

            this.fetch({
                data   : options,
                reset  : true,
                success: function (newCollection) {

                },
                error  : function (err, xhr) {
                    console.log(xhr);
                }
            });
        },

        showMore: function (options) {
            var that = this;
            var filterObject = options || {};

            filterObject.filter = options ? options.filter : {};

            this.fetch({
                data   : filterObject,
                waite  : true,
                success: function (models) {
                    that.page += 1;
                    that.trigger('showmore', models);
                },
                error  : function () {
                    App.render({
                        type: 'error',
                        message: "Some Error."
                    });
                }
            });
        }
    });

    return gLReportCollection;
});

