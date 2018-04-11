define([
    'Backbone',
    'collections/parent',
    'models/ProductModel',
    'constants'
], function (Backbone, Parent, ProductModel, CONSTANTS) {
    'use strict';

    var productParameterCollection = Parent.extend({
        model   : ProductModel,
        url     : CONSTANTS.URLS.PRODUCTPARAMETER,
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

    return productParameterCollection;
});
