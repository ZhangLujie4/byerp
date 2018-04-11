define([
    'Backbone',
    'models/AluveneerOrdersModel',
    'constants',
    'collections/parent'
], function (Backbone, AluveneerOrdersModel, CONSTANTS, Parent) {
    'use strict';

    var AluveneerOrdersCollection = Parent.extend({
        model       : AluveneerOrdersModel,
        url         : CONSTANTS.URLS.ALUVENEERORDERS,
        page        : null,

        initialize: function (options) {
            var page;

            this.viewType = options.viewType;
            this.contentType = options.contentType;

            this.filter = options.filter;
            
            if (options && options.contentType && !(options.filter)) {
            } 

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

    return AluveneerOrdersCollection;
});
