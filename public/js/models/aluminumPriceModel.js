define([
    'Backbone',
    'constants'
], function (Backbone, CONSTANTS) {
    'use strict';
    var aluminumPriceModel = Backbone.Model.extend({
        idAttribute: '_id',
        initialize : function () {
        },

        urlRoot: function () {
            return CONSTANTS.URLS.ALUMINUMPRICE;
        }
    });
    return aluminumPriceModel;
});
