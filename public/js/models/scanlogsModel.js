define([
    'Backbone',
    'Underscore',
    'moment',
    'common',
    'Validation',
    'constants'
], function (Backbone, _, moment, common, Validation, CONSTANTS) {
    'use strict';

    var scanlogsModel = Backbone.Model.extend({
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
            if (response.scantime) {
                response.scantime = moment(response.scantime).format('YYYY-MM-DD, H:mm:ss');
            }
            if (response.uploadtime) {
                response.uploadtime = moment(response.uploadtime).format('YYYY-MM-DD, H:mm:ss');
            }
            return response;
        },

        validate: function (attrs) {
            var errors = [];

            //Validation.checkJobPositionField(errors, true, attrs.projectId, '项目名称');
            //Validation.checkJobPositionField(errors, true, attrs.orderNumber, '退货单号');

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.SCANLOGS;
        }
    });
    return scanlogsModel;
});
