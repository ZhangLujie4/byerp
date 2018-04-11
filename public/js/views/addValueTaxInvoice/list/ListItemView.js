define([
    'Backbone',
    'Underscore',
    'text!templates/addValueTaxInvoice/list/ListTemplate.html'
], function (Backbone, _, ListTemplate) {
    var invoiceListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;

        },

        render: function () {

            this.$el.append(_.template(ListTemplate, {
                tasksCollection: this.collection.toJSON(),
                toDay:this.thisday

            }));
        }
    });

    return invoiceListItemView;
});
