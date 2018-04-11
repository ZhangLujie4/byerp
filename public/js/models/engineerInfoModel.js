define([
    'Backbone',
    'constants',
    'moment',
    'Validation'
], function (Backbone, CONSTANTS, moment, Validation) {

    var engineerInfoModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.ENGINEERINFO;
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
                if(response.StartDate){
                    response.StartDate = moment(response.StartDate).format('YYYY-MM-DD');
                }
                if(response.EndDate){
                    response.EndDate = moment(response.EndDate).format('YYYY-MM-DD');
                }
                if(response.cancelDate){
                    response.cancelDate = moment(response.cancelDate).format('YYYY-MM-DD');
                }
             }
             return response;

        },

        validate: function (attrs) {
            var errors = [];
            Validation.checkNameField(errors, true, attrs['name'], '工程名称');
            Validation.checkNameField(errors, true, attrs['pmr'], '项目经理');
            Validation.checkNameField(errors, true, attrs['pmv'], '备案项目经理');

            if (errors.length > 0) {
                return errors;
            }
        },
    });
    return engineerInfoModel;

});