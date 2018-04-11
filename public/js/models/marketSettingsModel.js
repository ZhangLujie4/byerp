/**
 * Created by wmt on 2017/7/21.
 */
define([
    'Backbone',
    'constants'
], function (Backbone, CONSTANTS) {
    'use strict';
    var marketSettingsModel = Backbone.Model.extend({
        idAttribute: '_id',
        initialize : function () {
        },

        urlRoot: function () {
            return CONSTANTS.URLS.MARKETSETTINGS;
        }
    });
    return marketSettingsModel;
});
