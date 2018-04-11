define([
    'Backbone',
    'models/addValueTaxInvoiceModel',
    'constants',
    'collections/parent'
], function (Backbone, acceptModel, CONSTANTS, Parent) {
    'use strict';

    var addValueCollection = Parent.extend({
        model       : acceptModel,
        url         : CONSTANTS.URLS.ADDVALUETAXINVOICE,
        page        : null,
        namberToShow: null,
        viewType    : null,

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

            this.parrentContentId = options.parrentContentId || null;
            this.viewType = options.viewType;
            this.startTime = new Date();
            this.contentType = options.contentType;

            if (page) {
                return this.getPage(page, options);
            }

            this.getFirstPage(options);
        }

    });

    return addValueCollection;
});
