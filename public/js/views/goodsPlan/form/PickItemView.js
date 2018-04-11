define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/goodsPlan/form/PickItemsHeader.html',
    'text!templates/goodsPlan/form/PickItemsEditList.html',
    'collections/Products/products',
], function (Backbone, $, _, PickItemsHeader, PickItemsEditList, ProductCollection) {
    'use strict';
    var ProductItemTemplate = Backbone.View.extend({
        initialize: function (options) {;
            var products;
            options = options || Object.create(null);
            if (options) {
                this.parentModel = options.parentModel;
                delete options.parentModel;
            }

            this.project = options.project;
        },

        render: function (options) {
            var productsContainer;
            var $thisEl = this.$el;
            var model = this.parentModel ? this.parentModel.toJSON() : options ? options.model : '';
            var products;
            var templ;

            this.$dialogContainer = $('#dialogContainer').html() ? $('#dialogContainer') : $('#formContent');

            if (model) {

                products = model.products;

                templ = _.template(PickItemsHeader);
              
                $thisEl.html(templ({
                    model      : model
                }));
                productsContainer = $thisEl.find('#productList');
                productsContainer.append(_.template(PickItemsEditList, {
                    products : products
                }));
            }

            return this;
        }
    });

    return ProductItemTemplate;
});
