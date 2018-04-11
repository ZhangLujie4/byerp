/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'collections/parent',
    'models/royaltyDetailsModel',
    'constants'
], function (Backbone, Parent, royaltyDetailsModel, CONSTANTS) {
    var Collection = Parent.extend({
        model   : royaltyDetailsModel,
        url     : '/royaltyDetails/',
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
    return Collection;
});
