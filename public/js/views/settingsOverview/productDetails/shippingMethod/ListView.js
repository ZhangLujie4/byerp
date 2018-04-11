define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/settingsOverview/productDetails/shippingMethod/ListTemplate.html',
    'views/settingsOverview/productDetails/shippingMethod/EditView',
    'views/settingsOverview/productDetails/shippingMethod/CreateView',
    'helpers'
], function (Backbone, _, $, PaymentMethodList, EditView, CreateView, helpers) {
    'use strict';

    var ContentView = Backbone.View.extend({
        template  : _.template(PaymentMethodList),
        el        : '#shippimhMethodTab',
        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;

            this.collection.bind('add change', this.render, this);

            this.render();
        },

        events: {
            'click .goToEdit'         : 'goToEditDialog',
            'click .goToRemove'       : 'deleteItem',
            'click #top-bar-createBtn': 'create',
            'click .toggleList'       : 'toggleList'
        },

        deleteItem: function (e) {
            var self = this;
            var tr = $(e.target).closest('tr');
            var id = tr.attr('data-id');
            var model = this.collection.get(id);
            var answer = confirm('Really DELETE items ?!');

            e.preventDefault();

            if (answer === true && model) {

                model.destroy({
                    success: function (model) {
                        self.$el.find('tr[data-id="' + model.id + '"]').remove();
                    },

                    error: function (model, err) {
                        if (err.status === 403) {
                            App.render({
                                type   : 'error',
                                message: 'You do not have permission to perform this action'
                            });
                        }
                    }
                });
            }
        },

        toggleList: function (e) {
            e.preventDefault();

            this.$el.find('.forToggle').toggle();
        },

        goToEditDialog: function (e) {
            var tr = $(e.target).closest('tr');
            var id = tr.attr('data-id');
            var model = this.collection.get(id);

            e.preventDefault();

            if (model) {
                return new EditView({model: model, collection: this.collection});
            }
        },

        create: function (e) {
            e.preventDefault();

            return new CreateView({collection: this.collection});
        },

        render: function () {
            this.$el.html(this.template({
                collection      : this.collection.toJSON(),
                currencySplitter: helpers.currencySplitter
            }));
        }

    });

    return ContentView;
});
