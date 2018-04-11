define([
    'Backbone',
    'moment'
], function (Backbone, moment) {

    var oemOutNoteModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return '/oemOutNote/';
        },

        defaults: {
        },
    });
    return oemOutNoteModel;

});
