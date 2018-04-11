define([
    'Backbone',
    'models/marketSettingsModel',
    'collections/parent',
    'constants'
], function (Backbone, marketSettingsModel, Parent, CONSTANTS) {
    'use strict';

    var marketSettingsCollection = Parent.extend({

        model   : marketSettingsModel,
        url     : CONSTANTS.URLS.MARKETSETTINGS,
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

            if (options && options.url) {
                this.url = options.url;
                delete options.url;
            }

            this.startTime = new Date();

            if (page) {
                return this.getPage(page, options);
            }

            this.getFirstPage(options);
        }
    });

    return marketSettingsCollection;
});