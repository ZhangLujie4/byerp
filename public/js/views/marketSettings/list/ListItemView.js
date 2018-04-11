define([
    'Backbone',
    'Underscore',
    'text!templates/marketSettings/list/ListTemplate.html'
], function (Backbone, _, ListTemplate) {
    var ListItemView = Backbone.View.extend({
        el: '#listTable',


        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            this.$el.append(_.template(ListTemplate, {
                Collection: this.collection.toJSON()
            }));
        }
    });

    return ListItemView;
});
