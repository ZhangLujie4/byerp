define([
    'Backbone',
    'constants',
    'moment',
    'Validation'
], function (Backbone, CONSTANTS, moment, Validation) {

    var managementRuleModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.MANAGEMENTRULE;
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
            Validation.checkNameField(errors, true, attrs['categoryTex'], '类别');
            Validation.checkNameField(errors, true, attrs['categoryNum'], '类别序号');
            Validation.checkNameField(errors, true, attrs['number'], '项目序号');
            Validation.checkNameField(errors, true, attrs['content'], '实施内容');
            Validation.checkNameField(errors, true, attrs['penalty'], '未达标处罚');

            if (errors.length > 0) {
                return errors;
            }
        },
    });
    return managementRuleModel;

});