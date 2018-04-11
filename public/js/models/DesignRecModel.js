define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants'
], function (Backbone, _, common, Validation, CONSTANTS) {
    'use strict';

    var DesignRecModel = Backbone.Model.extend({
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
            if (response && response.attachments) {
                _.map(response.attachments, function (attachment) {
                    attachment.uploadDate = common.utcDateToLocaleDate(attachment.uploadDate);
                    return attachment;
                });
            }
            if (response.createdBy) {
                response.createdBy.date = common.utcDateToLocaleDateTime(response.createdBy.date);
            }
            if (response.editedBy && response.editedBy.date) {
                response.editedBy.date = common.utcDateToLocaleDateTime(response.editedBy.date);
            }
            if (response && response.notes) {
                _.map(response.notes, function (notes) {
                    notes.date = common.utcDateToLocaleDate(notes.date);
                    return notes;
                });
            }
            return response;
        },

        validate: function (attrs) {
            var errors = [];

            Validation.checkJobPositionField(errors, true, attrs.acreage, '面积');
            Validation.checkJobPositionField(errors, true, attrs.orderNumber, '订单编号');
            Validation.checkJobPositionField(errors, true, attrs.arrivalDate, '到货日期');
            Validation.checkJobPositionField(errors, true, attrs.protectType, '保护膜类型');

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.DESIGNREC;
        }
    });
    return DesignRecModel;
});
