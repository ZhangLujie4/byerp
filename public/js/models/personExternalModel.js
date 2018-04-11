define([
    'Backbone',
    'constants',
    'moment'
], function (Backbone, CONSTANTS, moment) {

    var personExternalModel = Backbone.Model.extend({
        idAttribute: '_id',

        urlRoot: function () {
            return CONSTANTS.URLS.PERSONEXTERNAL;
        },

        defaults: {
        },
        parse: function(response){
            if (!response.data) {
                if (response.editedBy) {
                    response.editedBy.date = moment(response.editedBy.date).format('YYYY-MM-DD, H:mm:ss');
                }
            }
            return response;
        },

    });
    return personExternalModel;

});