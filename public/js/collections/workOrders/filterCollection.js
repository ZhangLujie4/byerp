define([
    'Backbone',
    'models/WorkOrdersModel',
    'constants',
    'collections/parent'
], function (Backbone, WorkOrdersModel, CONSTANTS, Parent) {
    'use strict';

    var WorkOrdersCollection = Parent.extend({
        model       : WorkOrdersModel,
        url         : CONSTANTS.URLS.WORKORDERS,
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

    return WorkOrdersCollection;
});
