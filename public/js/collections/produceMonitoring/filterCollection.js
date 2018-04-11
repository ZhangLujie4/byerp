define([
    'Backbone',
    'models/ProduceMonitoringModel',
    'constants',
    'collections/parent'
], function (Backbone, ProduceMonitoringModel, CONSTANTS, Parent) {
    'use strict';

    var ProduceMonitoringCollection = Parent.extend({
        model       : ProduceMonitoringModel,
        url         : CONSTANTS.URLS.PRODUCEMONITORING,
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

    return ProduceMonitoringCollection;
});
