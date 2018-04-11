define([
    'Backbone',
    'constants',
    'moment'
], function (Backbone, CONSTANTS, moment) {

    var personDeductionModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.PERSONDEDUCTION;
        },

        defaults: {
        },
        

    });
    return personDeductionModel;

});