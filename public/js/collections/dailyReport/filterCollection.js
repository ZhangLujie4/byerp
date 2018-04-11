define([
    'Backbone',
    'collections/parent',
    'models/dailyReportModel',
    'dataService',
    'constants'
], function (Backbone, Parent, dailyReportModel, dataService, CONSTANTS) {
    'use strict';

    var dailyReportCollection = Parent.extend({
        model: dailyReportModel,
        url  : CONSTANTS.URLS.DAILYREPORT,

        initialize: function (options) {
            var page;

            function _errHandler(models, xhr) {
                if (xhr.status === 401) {
                    Backbone.history.navigate('#login', {trigger: true});
                }
            }

            options = options || {};
            options.error = options.error || _errHandler;
            page = options.page;

            this.startTime = new Date();

            this.filter = options.filter;

            if (page) {
                return this.getPage(page, options);
            }

            this.getFirstPage(options);
        }
    });

    return dailyReportCollection;
});
