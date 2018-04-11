define([
    'Backbone',
    'constants',
    'moment'
], function (Backbone, CONSTANTS, moment) {

    var busiTripModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.BUSITRIP;
        },

        defaults: {
            busiTrip: '',
            name:     ''
        },
        parse: function(response){
             if (!response.data) {
                if(response.registrationDate){
                    response.registrationDate = moment(response.registrationDate).format('YYYY-MM-DD');
                }
                 if (response.date) {
                    response.date.from = moment(response.date.from).format('YYYY-MM-DD');
                    response.date.to = moment(response.date.to).format('YYYY-MM-DD');
                }
                if (response.createdBy) {
                    response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD, H:mm:ss');
                }

                if (response.editedBy) {
                    response.editedBy.date = moment(response.editedBy.date).format('YYYY-MM-DD, H:mm:ss');
                }
             }
             return response;

        }
    });
    return busiTripModel;

});