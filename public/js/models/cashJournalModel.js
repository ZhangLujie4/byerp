define([
    'Backbone',
    'Underscore',
    'moment',
    'constants'
], function (Backbone, _, moment, CONSTANTS) {
    'use strict';

    var cashJournalModel = Backbone.Model.extend({
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
            if (response.date) {
                response.date = moment(response.date).format('YYYY-MM-DD');
            }
            if(response.debitAccount){
                if(response.debitAccount.type=='库存现金'){
                    response.credit=0;
                    response.debitAccount=null;
                }
            }
            if(response.creditAccount){
                if(response.creditAccount.type=='库存现金'){
                    response.debit=0;
                    response.creditAccount=null;
                }
            }


            return response;

        },


        urlRoot: function () {
            return CONSTANTS.URLS.CASHJOURNAL;
        }
    });
    return cashJournalModel;
});
