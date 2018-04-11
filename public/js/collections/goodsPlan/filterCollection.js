define([
    'Underscore',
    'Backbone',
    'collections/parent',
    'models/goodsPlanModel',
    'common',
    'constants'
], function (_, Backbone, ParentCollection, goodsPlanModel, common, CONSTANTS) {
    'use strict';

    var goodsPlanCollection = ParentCollection.extend({

        model: goodsPlanModel,
        url  : CONSTANTS.URLS.GOODSPLAN,
        initialize: function (options) {
            var page;

            function _errorHandler(models, xhr) {
                if (xhr.status === 401) {
                    Backbone.history.navigate('#login', {trigger: true});
                }
            }

            options = options || {};
            page = options.page;
            options.error = options.error || _errorHandler;
            this.contentType = options.contentType;

            this.startTime = new Date();

            if (options.url) {
                this.url = options.url;
            }

            if (page) {
                return this.getPage(page, options);
            }

            this.getFirstPage(options);
        },

        parse: function (response) {
            var quotations = response.data;

            response.data = _.map(quotations, function (quotation) {
                quotation.orderDate = common.utcDateToLocaleDate(quotation.orderDate);
                if (quotation.expectedDate) {
                    quotation.expectedDate = common.utcDateToLocaleDate(quotation.expectedDate);
                }

                return quotation;
            });

            return ParentCollection.prototype.parse.call(this, response);
        }

    });

    return goodsPlanCollection;

});
