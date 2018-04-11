define([
    'Backbone',
    'collections/parent',
    'models/stampApplicationModel',
    'constants'
], function (Backbone, Parent, stampApplicationModel, CONSTANTS) {
    'use strict';

    var stampApplicationCollection = Parent.extend({
        model   : stampApplicationModel,
        url     : CONSTANTS.URLS.STAMPAPPLICATION,
        pageSize: CONSTANTS.DEFAULT_ELEMENTS_PER_PAGE,

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

            if (page) {
                return this.getPage(page, options);
            }

            this.getFirstPage(options);
        }
    });

    return stampApplicationCollection;
});
