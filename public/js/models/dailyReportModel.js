define([
    'Backbone',
    'constants',
    'Validation'
], function (Backbone, CONSTANTS, Validation) {
    'use strict';

    var dailyReportModel = Backbone.Model.extend({
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
            return CONSTANTS.URLS.DAILYREPORT;
        },
        validate: function (attrs) {
            var errors = [];
            //这里用来判断类型
            // Validation.checkNumberField(errors, true, attrs['point'], '工分');
            // Validation.checkJobPositionField(errors, true, attrs['employee'], '姓名');

            if (errors.length > 0) {
                return errors;
            }
        },
    });

    return dailyReportModel;
});
