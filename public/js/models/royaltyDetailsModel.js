/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone'
], function (Backbone, moment) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot    : function () {
            return '/royaltyDetails/';
        }
    });
    return Model;
});
