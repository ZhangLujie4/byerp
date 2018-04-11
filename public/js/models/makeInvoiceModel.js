
define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants',
    'moment'
], function (Backbone, _, common, Validation, CONSTANTS,moment) {
    'use strict';

    var makeInvoiceModel = Backbone.Model.extend({
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
           if (response.invoice) {
               response.invoice.invoiceDate = moment(response.invoice.invoiceDate).format('YYYY-MM-DD');
            }
            if (response.day) {
                response.day = moment(response.day).format('YYYY-MM-DD');
            }
            return response;
        },



        urlRoot: function () {
            return CONSTANTS.URLS.MAKEINVOICE;
        }
    });
    return makeInvoiceModel;
});
