define([
    'Backbone',
    'Underscore',
    'moment',
    'constants'
], function (Backbone, _, moment, CONSTANTS) {
    'use strict';

    var designInvoiceModel = Backbone.Model.extend({
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

        validate: function () {
            var errors = [];

            if (errors.length > 0) {
                return errors;
            }
        },

        parse: function (response) {
            if (response.invoiceDate) {
                response.invoiceDate = moment(response.invoiceDate).format('YYYY-MM-DD');
            }
            if (response.type) {
                switch(response.type){
                    case 'invoice':
                        response.type='发票';
                        break;
                    case 'deposit':
                        response.type='收据';
                        break;

                }
            }

            return response;

        },


        urlRoot: function () {
            return CONSTANTS.URLS.DESIGNINVOICE;
        }
    });
    return designInvoiceModel;
});
