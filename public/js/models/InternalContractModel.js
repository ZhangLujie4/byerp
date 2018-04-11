
define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants',
    'moment'
], function (Backbone, _, common, Validation, CONSTANTS,moment) {
    'use strict';

    var LabourContractModel = Backbone.Model.extend({
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
            if (response.StartDate) {
                response.StartDate = moment(response.StartDate).format('YYYY-MM-DD');
            }if (response.signedDate) {
                response.signedDate = moment(response.signedDate).format('YYYY-MM-DD');
            }
            if (response.finishDate) {
                response.finishDate = moment(response.finishDate).format('YYYY-MM-DD');
            }
            if (response.proDate) {
                response.proDate = moment(response.proDate).format('YYYY-MM-DD');
            }
            if (response.EndDate) {
                response.EndDate = common.utcDateToLocaleDate(response.EndDate);
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

            // Validation.checkGroupsNameField(errors, true, attrs.summary, 'Summary');
            Validation.checkGroupsNameField(errors, true, attrs.project._id || attrs.project, 'Project');
            //Validation.checkGroupsNameField(errors, true, attrs.assignedTo._id || attrs.assignedTo, 'AssignedTo');

            if (attrs.deadline && attrs.StartDate) {
                Validation.checkFirstDateIsGreater(errors, attrs.deadline, 'deadline date', attrs.StartDate, 'Start date');
            }

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.INTERNALCONTRACT;
        }
    });
    return LabourContractModel;
});
