define([
    'Backbone',
    'Underscore',
    'text!templates/checkSituApprove/list/ListTemplate.html',
    'moment'
], function (Backbone, _, ListTemplate, moment) {
    'use strict';

    var ListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;// Counting the start index of list items
        },

        render: function () {
            console.log(this.collection.toJSON());
            this.$el.append(_.template(ListTemplate, {
                checkSituApproveCollection: this.collection.toJSON(),
                moment: moment
                //startNumber    : this.startNumber
            }));
        }
    });

    return ListItemView;
});
