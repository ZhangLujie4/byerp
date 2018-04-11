define([
    'Backbone',
    'models/ProcessContentsModel',
    'constants',
    'collections/parent'
], function (Backbone, ProcessContentsModel, CONSTANTS, Parent) {
    'use strict';

    var ProcessContentsCollection = Parent.extend({
        model       : ProcessContentsModel,
        url         : CONSTANTS.URLS.PROCESSCONTENTS,
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

    return ProcessContentsCollection;
});
