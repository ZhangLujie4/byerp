define([
    'Backbone',
    'collections/parent',
    'models/StampModel',
    'constants'
], function (Backbone, Parent, StampModel, CONSTANTS) {
    'use strict';

    var StampCollection = Parent.extend({
        model   : StampModel,
        url     : CONSTANTS.URLS.SETTINGSSTAMP,
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

    return StampCollection;
});
