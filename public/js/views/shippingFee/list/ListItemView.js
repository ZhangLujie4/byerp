define([
    'Backbone',
    'Underscore',
    'text!templates/shippingFee/list/ListTemplate.html',
    'moment'
], function (Backbone, _, shippingFeeListTemplate, moment) {
    'use strict';

    var shippingFeeListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            
            this.$el.append(_.template(shippingFeeListTemplate, {

                shippingNoteCollection: this.collection.toJSON(),
                moment: moment
            }));
        }
    });

    return shippingFeeListItemView;
});
