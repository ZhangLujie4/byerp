define([
    'Backbone',
    'Underscore',
    'moment',
    'constants'
], function (Backbone, _, moment, CONSTANTS) {
    'use strict';

    var enterpriseModel = Backbone.Model.extend({
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
            if (response.createdBy) {
                response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD');
            }
            return response;
        },


        urlRoot: function () {
            return CONSTANTS.URLS.DESIGNROYALTY;
        }
    });
    return enterpriseModel;
});
