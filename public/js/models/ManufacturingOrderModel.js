define([
    'Underscore',
    'Backbone',
    'common',
    'moment',
    'constants'
], function (_, Backbone, common, moment, CONSTANTS) {
    'use strict';

    var Model = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.MANUFACTURING_ORDERS;
        },

        defaults: {
            availability: '1',
            workflow    : 'Processing'
        },

        parse: function (response) {
            if (response) {
                if (response.deadlineStart) {
                    response.deadlineStart = moment(response.deadlineStart).format('YYYY-MM-DD');
                }
            }

            return response;
        }
    });

    return Model;
});
