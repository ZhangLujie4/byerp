/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'Underscore',
    'text!templates/royaltyDetails/list/ListTemplate.html',
    'helpers',
    'common'
], function (Backbone, _, PaymentListTemplate, helpers, common) {
    'use strict';

    var ListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize; // Counting the start index of list items
        },

        render: function (options) {
            var el = (options && options.thisEl) ? options.thisEl : this.$el;

            el.append(_.template(PaymentListTemplate, {
                collection       : this.collection.toJSON(),
                startNumber      : this.startNumber,
                currencySplitter : helpers.currencySplitter,
                currencyClass    : helpers.currencyClass,
                common           : common
            }));
        }
    });

    return ListItemView;
});
