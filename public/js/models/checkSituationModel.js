define([
    'Backbone',
    'constants',
    'moment'
], function (Backbone, CONSTANTS, moment) {

    var checkSituationModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.CHECKSITUATION;
        },

        defaults: {
        },

        parse: function(response){
             if (!response.data) {
                if(response.inspectDate){
                    response.inspectDate = moment(response.inspectDate).format('YYYY-MM-DD');
                }
             }
             return response;

        }
    });
    return checkSituationModel;

});