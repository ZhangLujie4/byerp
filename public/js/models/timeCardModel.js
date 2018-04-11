define([
    'Backbone',
    'constants'
], function (Backbone, CONSTANTS) {

    var timeCardModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.TIMECARD;
        },

        defaults: {
        }
    });
    return timeCardModel;

});
