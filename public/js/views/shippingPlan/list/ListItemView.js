define([
    'Backbone',
    'Underscore',
    'text!templates/shippingPlan/list/ListTemplate.html',
    'helpers',
    'common'
], function (Backbone, _, PaymentListTemplate, helpers, common) {
    'use strict';

    var PaymentListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize; // Counting the start index of list items
        },

        render: function (options) {
            var el = (options && options.thisEl) ? options.thisEl : this.$el;

            el.append(_.template(PaymentListTemplate, {
                paymentCollection: this.collection.toJSON(),
                startNumber      : this.startNumber,
                currencySplitter : helpers.currencySplitter,
                currencyClass    : helpers.currencyClass,
                common           : common
            }));
        }
    });

    return PaymentListItemView;
});
