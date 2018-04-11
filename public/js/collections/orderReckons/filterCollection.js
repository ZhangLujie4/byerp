define([
    'Backbone',
    'models/OrderReckonsModel',
    'constants',
    'collections/parent'
], function (Backbone, OrderReckonsModel, CONSTANTS, Parent) {
    'use strict';

    var OrderReckonsCollection = Parent.extend({
        model       : OrderReckonsModel,
        url         : CONSTANTS.URLS.ORDERRECKONS,
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

    return OrderReckonsCollection;
});
