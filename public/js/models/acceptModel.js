
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
            if (response.acceptDate) {
                response.acceptDate = moment(response.acceptDate).format('YYYY-MM-DD');
            }if (response.endDate) {
                response.endDate = moment(response.endDate).format('YYYY-MM-DD');
            }if (response.payDate) {
                response.payDate = moment(response.payDate).format('YYYY-MM-DD');
            }
            if (response.acceptType) {
                switch(response.acceptType){
                    case 'buy':
                        response.acceptType='买入';
                        break;
                    case 'project':
                        response.acceptType='项目部交入';
                        break;
                    case 'company':
                        response.acceptType='公司自开';
                        break;
                }
            }
            return response;
        },


        urlRoot: function () {
            return CONSTANTS.URLS.ACCEPT;
        }
    });
    return AcceptModel;
});
