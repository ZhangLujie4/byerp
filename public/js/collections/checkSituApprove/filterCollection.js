define([
    'Backbone',
    'collections/parent',
    'models/checkSituationModel',
    'constants'
], function (Backbone, Parent, checkSituationModel, CONSTANTS) {
    'use strict';

    var checkSituApproveCollection = Parent.extend({
        model   : checkSituationModel,
        url     : CONSTANTS.URLS.CHECKSITUAPPROVE,
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
            this.filter = options.filter || {};
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

    return checkSituApproveCollection;
});
