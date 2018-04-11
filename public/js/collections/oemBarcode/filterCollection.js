define([
    'Backbone',
    'models/OemBarcodeModel',
    'constants',
    'collections/parent'
], function (Backbone, OemBarcodeModel, CONSTANTS, Parent) {
    'use strict';

    var OemBarcodeCollection = Parent.extend({
        model       : OemBarcodeModel,
        url         : CONSTANTS.URLS.OEMBARCODE,
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

    return OemBarcodeCollection;
});
