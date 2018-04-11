define([
    'Backbone',
    'constants',
    'moment',
    'Validation'
], function (Backbone, CONSTANTS, moment, Validation) {

    var taxFreeModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.TAXFREE;
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
            Validation.checkNumberField(errors, true, attrs['base'], '收税基数');
            Validation.checkNumberField(errors, true, attrs['deductible'], '可抵扣字段');

            if (errors.length > 0) {
                return errors;
            }
        },

    });
    return taxFreeModel;

});