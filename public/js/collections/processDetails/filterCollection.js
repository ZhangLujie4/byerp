define([
    'Backbone',
    'models/ProcessDetailsModel',
    'constants',
    'collections/parent'
], function (Backbone, ProcessDetailsModel, CONSTANTS, Parent) {
    'use strict';

    var ProcessDetailsCollection = Parent.extend({
        model       : ProcessDetailsModel,
        url         : CONSTANTS.URLS.PROCESSDETAILS,
        page        : null,

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

    return ProcessDetailsCollection;
});
