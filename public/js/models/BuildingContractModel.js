define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants'
], function (Backbone, _, common, Validation, CONSTANTS) {
    'use strict';

    var BuildingContractModel = Backbone.Model.extend({
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
            if (response.orderDate) {
                response.orderDate = common.utcDateToLocaleDate(response.orderDate);
            }
            if (response.deliveryDate1) {
                response.deliveryDate1 = common.utcDateToLocaleDate(response.deliveryDate1);
            }
            if (response.deliveryDate2) {
                response.deliveryDate2 = common.utcDateToLocaleDate(response.deliveryDate2);
            }
            if (response.expectDate) {
                response.expectDate = common.utcDateToLocaleDate(response.expectDate);
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

            //Validation.checkJobPositionField(errors, true, attrs.contractNum, '合同编号');
            //Validation.checkGroupsNameField(errors, true, attrs.summary, 'Summary');
            //Validation.checkGroupsNameField(errors, true, attrs.project._id || attrs.project, 'Project');
            //Validation.checkGroupsNameField(errors, true, attrs.assignedTo._id || attrs.assignedTo, 'AssignedTo');

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.BUILDINGCONTRACT;
        }
    });
    return BuildingContractModel;
});
