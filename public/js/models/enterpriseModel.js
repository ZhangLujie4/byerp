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


        urlRoot: function () {
            return CONSTANTS.URLS.ENTERPRISE;
        }
    });
    return enterpriseModel;
});
