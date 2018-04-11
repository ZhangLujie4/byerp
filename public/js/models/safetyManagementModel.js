define([
    'Backbone',
    'constants',
    'moment',
    'Validation'
], function (Backbone, CONSTANTS, moment, Validation) {

    var safetyManagementModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.SAFETYMANAGEMENT;
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

        parse: function(response){
             if (!response.data) {
                // if(response.createdBy.date){
                //     response.createdBy.date = moment(response.createdBy.date).utc().zone(-8).format('YYYY-MM-DD HH:mm:ss');
                // }
                // if(response.editedBy.date){
                //     response.editedBy.date = moment(response.editedBy.date).format('YYYY-MM-DD');
                // }
             }
             return response;

        },

        validate: function (attrs) {
            var errors = [];
            Validation.checkNameField(errors, true, attrs['content'], '内容');
            Validation.checkNameField(errors, true, attrs['classify'], '控制分类');

            if (errors.length > 0) {
                return errors;
            }
        },
    });
    return safetyManagementModel;

});