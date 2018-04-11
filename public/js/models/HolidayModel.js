define([
    'Backbone',
    'common',
    'constants',
    'Validation'
], function (Backbone, common, CONSTANTS, Validation) {
    'use strict';

    var HolidayModel = Backbone.Model.extend({
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


        urlRoot: function () {
            return CONSTANTS.URLS.HOLIDAY;
        },

        parse: function (holiday) {
            holiday.date = common.utcDateToLocaleDate(holiday.date);

            return holiday;
        },

        validate: function (attrs) {
            var errors = [];

            Validation.checkDateField(errors, true, attrs.date, '日期');
            Validation.checkJobPositionField(errors, true, attrs.type, '类型');

            if (errors.length > 0) {
                return errors;
            }
        },
    });

    return HolidayModel;
});
