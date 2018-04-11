define([
    'Backbone',
    'Underscore',
    'text!templates/costApportionment/list/ListTemplate.html',
    'moment'
], function (Backbone, _, ListTemplate,moment) {
    var costApportionmentListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            this.$el.append(_.template(ListTemplate, {
                collection: this.collection.toJSON()
            }));
        }
    });

    return costApportionmentListItemView;
});
