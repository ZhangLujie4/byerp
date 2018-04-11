define([
    'Backbone',
    'Underscore',
    'text!templates/timeCard/listInfo/listTemplate.html'
], function (Backbone, _, listTemplate) {
    'use strict';

    var timeCardListItemView = Backbone.View.extend({

        el           : '#listTable',
        newCollection: null,
        startNumber  : null,

        initialize: function (options) {
            this.collection = options.collection;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize; // Counting the start index of list items
        },

        render: function () {
            var collect = this.collection.toJSON();
            this.$el.append(_.template(listTemplate, {
                timeCardCollection: collect
                //startNumber: this.startNumber
            }));
        }
    });

    return timeCardListItemView;
});
