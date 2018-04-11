define([
    'Backbone',
    'constants',
    'moment'
], function (Backbone, CONSTANTS, moment) {

    var jobForemanModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.JOBFOREMAN;
        },

        defaults: {
        },

        parse: function(response){
             if (!response.data) {
                if(response.enterTime){
                    response.enterTime = moment(response.enterTime).format('YYYY-MM-DD');
                }
             }
             return response;

        }
    });
    return jobForemanModel;

});