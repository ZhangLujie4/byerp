define([
    'Backbone',
    'constants',
    'moment'
], function (Backbone, CONSTANTS, moment) {

    var engineerManagerModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.ENGINEERMANAGER;
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
    return engineerManagerModel;

});