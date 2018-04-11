define([
    'Backbone',
    'constants',
    'moment',
    'Validation'
], function (Backbone, CONSTANTS, moment, Validation) {

    var fileManagementModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return '/fileManagement/borrow/';
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
        
        parse: function(response){
             if (!response.data) {
                if(response.expectedDate){
                    response.expectedDate = moment(response.expectedDate).format('YYYY-MM-DD');
                }
                 if (response.borrowDate) {
                    response.borrowDate = moment(response.borrowDate).format('YYYY-MM-DD');
                }
                if (response.returnDate) {
                    response.returnDate = moment(response.returnDate).format('YYYY-MM-DD');
                }
             }
             return response;

        },
        validate: function (attrs) {
            var errors = [];
            Validation.checkNameField(errors, true, attrs['borrowDate'], '租借日期');
            Validation.checkNameField(errors, true, attrs['borrower.name'], '借方姓名');
            Validation.checkNameField(errors, true, attrs['borrower.ID'], '借方身份证');
            Validation.checkNameField(errors, true, attrs['borrower.phone'], '借方身份证');

            if (errors.length > 0) {
                return errors;
            }
        },
    });
    return fileManagementModel;

});