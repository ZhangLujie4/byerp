define([
    'Backbone',
    'Underscore',
    'text!templates/orderReckons/list/ListTemplate.html'
], function (Backbone, _, ListTemplate) {
    var OrderReckonsListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;// Counting the start index of list items
        },

        render: function () {
            this.$el.append(_.template(ListTemplate, {
                orderReckonsCollection: this.collection.toJSON(),
                //startNumber    : this.startNumber
            }));

        }
    });

    return OrderReckonsListItemView;
});
