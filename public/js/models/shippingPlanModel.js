define([
    'Backbone',
    'moment'
], function (Backbone, moment) {
    var paymentMethod = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot    : function () {
            return '/shippingPlan/';
        },

        parse: function (response) {
            if (!response.data) {

                if (response.createdBy && response.createdBy.date) {
                    response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD, H:mm');
                }

                if (response.date) {
                    response.date = moment(response.date).format('YYYY-MM-DD, H:mm');
                }

                if (response.status) {

                    if (response.status.pickedOn) {
                        response.status.pickedOn = moment(response.status.pickedOn).format('YYYY-MM-DD, H:mm');
                    }
                    if (response.status.packedOn) {
                        response.status.packedOn = moment(response.status.packedOn).format('YYYY-MM-DD, H:mm');
                    }
                    if (response.status.printedOn) {
                        response.status.printedOn = moment(response.status.printedOn).format('YYYY-MM-DD, H:mm');
                    }
                    if (response.status.shippedOn) {
                        response.status.shippedOn = moment(response.status.shippedOn).format('YYYY-MM-DD, H:mm');
                    }

                }

                return response;
            }
        }
    });
    return paymentMethod;
});
