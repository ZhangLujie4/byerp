/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'constants'
], function (Backbone, CONSTANTS) {
    'use strict';
    var depRoyaltyModel = Backbone.Model.extend({
        idAttribute: '_id',
        initialize : function () {
        },

        urlRoot: function () {
            return CONSTANTS.URLS.DEPROYALTY;
        }
    });
    return depRoyaltyModel;
});
