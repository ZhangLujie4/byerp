define([
    'Backbone',
    'constants',
    'moment',
    'Validation'
], function (Backbone, CONSTANTS, moment, Validation) {

    var missionAllowanceModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.MISSIONALLOWANCE;
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
            Validation.checkJobPositionField(errors, true, attrs['carLicense'], '车牌号');
            Validation.checkNumberField(errors, true, attrs['allowanceStandard'], '补贴标准');
            Validation.checkJobPositionField(errors, true, attrs['jobPosition'], '职务');
            Validation.checkJobPositionField(errors, true, attrs['Department'], '部门');

            if (errors.length > 0) {
                return errors;
            }
        },

    });
    return missionAllowanceModel;

});