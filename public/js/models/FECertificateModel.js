/**
 * Created by admin on 2017/6/26.
 */
define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants',
    'moment'
], function (Backbone, _, common, Validation, CONSTANTS,moment) {
    'use strict';

    var AcceptModel = Backbone.Model.extend({
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

            if (response.makeDate) {
                response.makeDate = moment(response.makeDate).format('YYYY-MM-DD');
            }if (response.endDate) {
                response.endDate = moment(response.endDate).format('YYYY-MM-DD');
            }
            if (response.logoutDate) {
                response.logoutDate = moment(response.logoutDate).format('YYYY-MM-DD');
            }
            return response;
        },

        urlRoot: function () {
            return CONSTANTS.URLS.FECERTIFICATE;
        }
    });
    return AcceptModel;
});
