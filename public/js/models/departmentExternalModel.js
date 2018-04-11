define([
    'Backbone',
    'constants',
    'moment'
], function (Backbone, CONSTANTS, moment) {

    var departmentExternalModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.DEPARTMENTEXTERNAL;
        },

        defaults: {
        },

    });
    return departmentExternalModel;

});