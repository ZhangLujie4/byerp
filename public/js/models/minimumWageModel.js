define([
    'Backbone',
    'constants',
    'moment',
    'Validation'
], function (Backbone, CONSTANTS, moment, Validation) {

    var minimumWageModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.MINIMUMWAGE;
        },

        initialize: function () {
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

        defaults: {
        },

        validate: function (attrs) {
            var errors = [];
            Validation.checkNumberField(errors, true, attrs['wage'], '最低工资标准');
            Validation.checkNumberField(errors, true, attrs['communication'], '通讯补贴');

            if (errors.length > 0) {
                return errors;
            }
        },

    });
    return minimumWageModel;

});