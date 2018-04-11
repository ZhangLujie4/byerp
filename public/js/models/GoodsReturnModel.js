define([
    'Backbone',
    'Underscore',
    'moment',
    'common',
    'Validation',
    'constants'
], function (Backbone, _, moment, common, Validation, CONSTANTS) {
    'use strict';

    var goodsReturnModel = Backbone.Model.extend({
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

        parse: function (response) {
            if (response.createdBy) {
                response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD, H:mm:ss');
            }
            if (response.editedBy && response.editedBy.date) {
                response.editedBy.date = moment(response.editedBy.date).format('YYYY-MM-DD, H:mm:ss');
            }
            return response;
        },

        validate: function (attrs) {
            var errors = [];

            Validation.checkJobPositionField(errors, true, attrs.projectId, '项目名称');
            Validation.checkJobPositionField(errors, true, attrs.orderNumber, '退货单号');

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.GOODSRETURN;
        }
    });
    return goodsReturnModel;
});
