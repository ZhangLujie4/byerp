define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants'
], function (Backbone, _, common, Validation, CONSTANTS) {
    'use strict';

    var ProduceScheduleModel = Backbone.Model.extend({
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
            if (response.arrivalDate) {
                response.arrivalDate = common.utcDateToLocaleDate(response.arrivalDate);
            }
            if (response.uploadDate) {
                response.uploadDate = common.utcDateToLocaleDate(response.uploadDate);
            }
            if (response.createdBy) {
                response.createdBy.date = common.utcDateToLocaleDateTime(response.createdBy.date);
            }
            if (response.editedBy && response.editedBy.date) {
                response.editedBy.date = common.utcDateToLocaleDateTime(response.editedBy.date);
            }
            return response;
        },

        validate: function (attrs) {
            var errors = [];

            Validation.checkJobPositionField(errors, true, attrs.produceType, '生产类型');
            Validation.checkJobPositionField(errors, true, attrs.orderNumber, '订单编号');

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.PRODUCESCHEDULE;
        }
    });
    return ProduceScheduleModel;
});
