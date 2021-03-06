﻿define([
    'Backbone',
    'Underscore',
    'text!templates/designRoyalty/list/ListTemplate.html',
    'moment'
], function (Backbone, _, ListTemplate,moment) {
    var designRoyaltyListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.thisday=moment(options.toDay).format('YYYY-MM-DD');
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;// Counting the start index of list items
        },

        render: function () {

            this.$el.append(_.template(ListTemplate, {
                tasksCollection: this.collection.toJSON(),
                toDay:this.thisday
                //startNumber    : this.startNumber
            }));
        }
    });

    return designRoyaltyListItemView;
});
