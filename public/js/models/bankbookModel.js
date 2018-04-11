define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants',
    'moment'
], function (Backbone, _, common, Validation, CONSTANTS,moment) {
    'use strict';

    var bankbookModel = Backbone.Model.extend({
        idAttribute: '_id',
        initialize : function () {
            this.on('invalid', function (model, errors) {
                var msg;

                if (errors.length > 0) {
                    msg = errors.join('\n');

                    App.render({
                        type   : 'error',
                        message: msg
                    });
                }
            });
        },

        parse: function (response) {
            if (response.date) {
                response.date = moment(response.date).format('YYYY-MM-DD');
            }
            return response;
        },


        urlRoot: function () {
            return CONSTANTS.URLS.BANKBOOK;
        }
    });
    return bankbookModel;
});
