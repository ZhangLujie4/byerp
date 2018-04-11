define([
    'Backbone',
    'Underscore',
    'text!templates/bankInfo/list/ListTemplate.html',
    'moment'
], function (Backbone, _, ListTemplate,moment) {
    var acceptListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {

            this.$el.append(_.template(ListTemplate, {
                tasksCollection: this.collection.toJSON(),
            }));
        }
    });

    return acceptListItemView;
});
