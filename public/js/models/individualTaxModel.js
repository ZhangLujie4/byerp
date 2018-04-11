define([
    'Backbone',
    'constants',
    'moment',
    'Validation'
], function (Backbone, CONSTANTS, moment, Validation) {

    var taxModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.TAX;
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
            Validation.checkNumberField(errors, true, attrs['countDeduction'], '速算扣除数');
            Validation.checkNumberField(errors, true, attrs['rate'], '税率');
            Validation.checkNumberField(errors, false, attrs['high'], '上界');
            Validation.checkNumberField(errors, true, attrs['low'], '下界');
            Validation.checkNumberField(errors, true, attrs['level'], '级数');

            if (errors.length > 0) {
                return errors;
            }
        },

    });
    return taxModel;

});