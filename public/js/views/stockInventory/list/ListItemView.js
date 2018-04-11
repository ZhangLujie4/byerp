define([
    'Backbone',
    'Underscore',
    'text!templates/stockInventory/list/listTemplate.html',
    'common'
], function (Backbone, _, listTemplate, common) {
    'use strict';

    var bonusTypeListItemView = Backbone.View.extend({

        el           : '#listTable',
        newCollection: null,
        startNumber  : null,

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            var collect = this.collection.toJSON();
            this.$el.append(_.template(listTemplate, {
                collection: collect,
                common    : common
            }));
        }
    });

    return bonusTypeListItemView;
});
