define([
    'Backbone',
    'Underscore',
    'models/managementRuleModel',
    'common',
    'constants',
    'collections/parent'
], function (Backbone, _, managementRuleModel, common, CONSTANTS, Parent) {
    'use strict';
    var UsersCollection = Parent.extend({
        model       : managementRuleModel,
        url         : CONSTANTS.URLS.MANAGEMENTRULE,
        page        : null,
        namberToShow: null,
        viewType    : null,
        contentType : null,

        initialize: function (options) {
            var page;

            options = options || {};

            this.startTime = new Date();
            this.contentType = options.contentType;

            page = options.page;

            if (page) {
                return this.getPage(page, options);
            }

            this.getFirstPage(options);
        },

    });
    return UsersCollection;
});
