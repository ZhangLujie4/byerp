define([
    'Backbone',
    'models/DesignRecModel',
    'constants',
    'collections/parent'
], function (Backbone, DesignRecModel, CONSTANTS, Parent) {
    'use strict';

    var DesignRecCollection = Parent.extend({
        model       : DesignRecModel,
        url         : CONSTANTS.URLS.DESIGNREC,
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

    return DesignRecCollection;
});
