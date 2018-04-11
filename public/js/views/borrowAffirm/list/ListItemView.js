define([
    'Backbone',
    'Underscore',
    'text!templates/borrowAffirm/list/ListTemplate.html',
    'moment'
], function (Backbone, _, listTemplate, moment) {
    'use strict';

    var borrowAffirmListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize; // Counting the start index of list items
        },

        render: function () {
            var result = this.collection.toJSON();
            this.$el.append(_.template(listTemplate, {Collection: result, moment: moment}));
        }
    });

    return borrowAffirmListItemView;
});
