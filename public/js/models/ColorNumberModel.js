define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants'
], function (Backbone, _, common, Validation, CONSTANTS) {
    'use strict';

    var ColorNumberModel = Backbone.Model.extend({
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
                response.createdBy.date = common.utcDateToLocaleDateTime(response.createdBy.date);
            }
            if (response.editedBy && response.editedBy.date) {
                response.editedBy.date = common.utcDateToLocaleDateTime(response.editedBy.date);
            }

            return response;
        },

        validate: function (attrs) {
            var errors = [];

            //Validation.checkGroupsNameField(errors, true, attrs.summary, 'Summary');
            //Validation.checkGroupsNameField(errors, true, attrs.project._id || attrs.project, 'Project');
            //Validation.checkGroupsNameField(errors, true, attrs.assignedTo._id || attrs.assignedTo, 'AssignedTo');

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.COLORNUMBER;
        }
    });
    return ColorNumberModel;
});
