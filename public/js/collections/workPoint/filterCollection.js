define([
    'Backbone',
    'collections/parent',
    'models/workPointModel',
    'dataService',
    'constants'
], function (Backbone, Parent, workPointModel, dataService, CONSTANTS) {
    'use strict';

    var workPointCollection = Parent.extend({
        model: workPointModel,
        url  : CONSTANTS.URLS.WORKPOINT,

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

    return workPointCollection;
});
