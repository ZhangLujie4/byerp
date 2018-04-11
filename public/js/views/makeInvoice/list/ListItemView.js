define([
    'Backbone',
    'Underscore',
    'text!templates/makeInvoice/list/ListTemplate.html',
    'moment'
], function (Backbone, _, ListTemplate,moment) {
    var invoiceListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            this.$el.append(_.template(ListTemplate, {
                tasksCollection: this.collection.toJSON()
            }));
        }
    });

    return invoiceListItemView;
});
