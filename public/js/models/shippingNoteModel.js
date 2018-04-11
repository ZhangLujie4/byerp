define([
    'Backbone',
    'moment'
], function (Backbone, moment) {

    var shippingNoteModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return '/shippingNote/';
        },

        defaults: {
        },
    });
    return shippingNoteModel;

});
