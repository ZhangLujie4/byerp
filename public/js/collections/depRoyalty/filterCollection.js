/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'models/depRoyaltyModel',
    'collections/parent',
    'constants'
], function (Backbone, depRoyaltyModel, Parent, CONSTANTS) {
    'use strict';

    var depRoyaltyCollection = Parent.extend({

        model   : depRoyaltyModel,
        url     : CONSTANTS.URLS.DEPROYALTY,
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

    return depRoyaltyCollection;
});