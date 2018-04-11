define([
    'Backbone',
    'constants',
    'Validation'
], function (Backbone, CONSTANTS, Validation) {
    'use strict';

    var workPointModel = Backbone.Model.extend({
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
        urlRoot    : function () {
            return CONSTANTS.URLS.WORKPOINT;
        },
        validate: function (attrs) {
            var errors = [];
            Validation.checkNumberField(errors, true, attrs['point'], '工分');
            Validation.checkJobPositionField(errors, true, attrs['employee'], '姓名');

            if (errors.length > 0) {
                return errors;
            }
        },
    });

    return workPointModel;
});
