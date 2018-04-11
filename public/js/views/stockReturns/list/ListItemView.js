define([
    'Backbone',
    'Underscore',
    'text!templates/stockReturns/list/ListTemplate.html',
    'helpers'
], function (Backbone, _, StockReturnsListTemplate, helpers) {
    'use strict';

    var StockReturnsListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize; // Counting the start index of list items
        },

        render: function (options) {
            var el = (options && options.thisEl) ? options.thisEl : this.$el;

            el.append(_.template(StockReturnsListTemplate, {
                collection       : this.collection.toJSON(),
                startNumber      : this.startNumber,
                currencySplitter : helpers.currencySplitter,
                currencyClass    : helpers.currencyClass
            }));
        }
    });

    return StockReturnsListItemView;
});
