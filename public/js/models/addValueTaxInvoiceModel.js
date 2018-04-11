define([
    'Backbone',
    'Underscore',
    'moment',
    'constants'
], function (Backbone, _, moment, CONSTANTS) {
    'use strict';

    var InvoiceModel = Backbone.Model.extend({
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
            if (response.invoiceDate) {
                response.invoiceDate = moment(response.invoiceDate).format('YYYY-MM-DD');
            }

                return response;

        },

        validate: function () {
            var errors = [];

            if (errors.length > 0) {
                return errors;
            }
        },


        urlRoot: function () {
            return CONSTANTS.URLS.ADDVALUETAXINVOICE;
        }
    });
    return InvoiceModel;
});
