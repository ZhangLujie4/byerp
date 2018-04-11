define([
    'Backbone',
    'models/buildingModel',
    'constants',
    'collections/parent'
], function (Backbone, buildingModel, CONSTANTS, Parent) {
    'use strict';

    var BuildingCollection = Parent.extend({
        model       : buildingModel,
        url         : CONSTANTS.URLS.BUILDING,
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

    return BuildingCollection;
});
