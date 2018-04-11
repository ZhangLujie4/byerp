define([
    'Backbone',
    'constants',
    'moment'
], function (Backbone, CONSTANTS, moment) {

    var stampApplicationModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.STAMPAPPLICATION;
        },

        defaults: {
        },

        parse: function(response){
             if (!response.data) {
                if(response.applyDate){
                    response.applyDate = moment(response.applyDate).format('YYYY-MM-DD');
                }
                
             }
             return response;

        }
    });
    return stampApplicationModel;

});