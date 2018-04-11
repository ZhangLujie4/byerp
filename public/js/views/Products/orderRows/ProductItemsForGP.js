/**
 * Created by wmt on 2017/8/5.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Products/orderRows/ProductItems.html',
    'text!templates/Products/orderRows/ExpenseInputContent.html',
    'text!templates/Products/orderRows/ProductInputContent.html',
    'text!templates/Products/orderRows/ProductItemsEditListForGP.html',
    'text!templates/Products/orderRows/ItemsEditListForGP.html',
    'text!templates/Products/orderRows/TotalAmountForGP.html',
    'collections/Products/products',
    'views/Projects/projectInfo/wTracks/generateWTrack',
    'views/selectView/selectView',
    'populate',
    'helpers',
    'dataService',
    'constants',
    'async',
    'helpers/keyValidator'
], function (Backbone,
             $,
             _,
             productItemTemplate,
             ExpenseInputContent,
             ProductInputContent,
             ProductItemsEditList,
             ItemsEditList,
             totalAmount,
             ProductCollection,
             GenerateWTrack,
             SelectView,
             populate,
             helpers,
             dataService,
             CONSTANTS,
             async,
             keyValidator) {
    'use strict';
    var ProductItemTemplate = Backbone.View.extend({

        template: _.template(productItemTemplate),

        initialize: function (options) {
            var products;

            options = options || Object.create(null);

            this.responseObj = {};
            this.taxesRate = 0;
            this.availableVisible = true;

            if (options) {
                this.parentModel = options.parentModel;
                this.projectModel = options.projectModel;
                this.wTrackCollection = options.wTrackCollection;
                this.availableVisible = options.availableVisible;
                this.createJob = options.createJob;
                this.notEditable = options.notEditable;
                this.discountVisible = options.discountVisible;
                this.deletedProducts = options.deletedProducts;

                this.forSales = options.forSales;

                delete options.projectModel;
                delete options.parentModel;
                delete options.wTrackCollection;
                delete options.createJob;
                delete options.visible;
                delete options.forSales;
                delete options.notEditable;
                delete options.discountVisible;
            }

            if (this.parentModel) {
                this.forSales = this.parentModel.get('forSales');
            }

            if (options && options.balanceVisible) {
                this.visible = options.balanceVisible;
            }
            if (options.writeOff) {
                this.writeOff = options.writeOff;
            }

            if (options && options.quotations) {
                this.quotations = options.quotations;
            } else {
                this.quotations = false;
            }

            this.expense = options.expense;

            this.notPayed = options.notPayed;

            this.project = options.project;

            options.projection = {
                name    : 1,
                info    : 1,
                variants: 1
            };
            this.responseObj = options.responseObj || {};

            products = new ProductCollection(options);
            products.bind('reset', function () {
                this.products = products;
                this.responseObj['#productsDd'] = products.toJSON();
                this.filterProductsForDD();
            }, this);

        },

        closeSelect: function (e) {
            $('.newSelectList').remove();
        },

        generateJob: function () {
            var self = this;
            var model = this.projectModel;
            var $projectsDdContainer = this.$dialogContainer.find('#projectDd'); // this.$projectsDdContainer created in render block
            var projectId = $projectsDdContainer.attr('data-id');

            if (!model) {
                $projectsDdContainer.css('color', 'red');

                App.render({
                    type   : 'error',
                    message: CONSTANTS.SELECTP_ROJECT
                });
            }

            if (projectId === model._id) {
                if (this.generatedView) {
                    this.generatedView.undelegateEvents();
                }

                this.generatedView = new GenerateWTrack({
                    model               : this.projectModel,
                    wTrackCollection    : this.wTrackCollection,
                    createJob           : true,
                    forQuotationGenerate: true,
                    quotationDialog     : this
                });
            } else {
                dataService.getData(CONSTANTS.URLS.PROJECTS_GET_FOR_WTRACK, {_id: projectId}, function (project) {
                    self.projectModel = project && project.data ? project.data[0] : {};

                    if (self.generatedView) {
                        self.generatedView.undelegateEvents();
                    }

                    self.generatedView = new GenerateWTrack({
                        model               : self.projectModel,
                        wTrackCollection    : self.wTrackCollection,
                        createJob           : true,
                        forQuotationGenerate: true,
                        quotationDialog     : self
                    });
                });
            }

            return false;
        },

        generatedWtracks: function () {
            var tr = this.$el.find('tr[data-error="true"]');
            var aEl = tr.find('a[data-id="jobs"]');
        },

        filterProductsForDD: function () {
            var id = '.productsDd';
            var self = this;
            var products = this.products.toJSON();

            this.responseObj[id] = products;

        },

        discountChange: function (e) {
            var $targetEl = $(e.target);

            if ($targetEl.val() > 100) {
                $targetEl.val(100);
            }
        },

        isNaN: function (val) {
            return isNaN(val) ? 0 : val;
        },

        quantityRetriver: function ($parent) {
            var selectedProduct = this.products || new Backbone.Collection();
            var id;
            var quantity;

            $parent = $parent.closest('tr');
            id = $parent.attr('data-id');

            selectedProduct = selectedProduct.get(id) || null;

            if (selectedProduct && selectedProduct.get('name') === CONSTANTS.IT_SERVICES) {
                quantity = 1;
            } else {
                quantity = $parent.find('#quantity').val() || $parent.find('td[data-name="quantity"]').text();
                //quantity = $.trim($parent.find('[data-name="quantity"]').text());
                quantity = parseInt(quantity);
            }

            quantity = this.isNaN(quantity);

            return quantity;
        },

        recalculateTaxes: function ($parent) {
            var quantity = this.quantityRetriver($parent);
            var total;
            var cost;
            var taxes;
            var subtotal;
            var taxesRate = parseFloat($parent.find('.current-selected.taxCode').attr('data-tax')) || 0;
            var taxContainer = $parent.find('.taxes .sum').length ? $parent.find('.taxes .sum') : $parent.find('[data-name="taxes"] .sum');

            $parent = $parent.closest('tr');

            cost = $parent.find('[data-name="price"] input').val() || $parent.find('[data-name="price"]').text();
            cost = parseFloat(helpers.spaceReplacer(cost)) || 0;

            total = quantity * cost;
            taxes = total * taxesRate;
            subtotal = total;

            taxes = taxes.toFixed(2);
            taxContainer.text(helpers.currencySplitter(taxes));

            subtotal = subtotal.toFixed(2);
            $parent.find('.subtotal .sum').text(helpers.currencySplitter(subtotal));

        },

        calculateTotal: function (discount) {
            var thisEl = this.$el;

            var totalUntaxContainer = thisEl.find('#totalUntaxes');
            var taxesContainer = thisEl.find('#taxes');
            var totalContainer = thisEl.find('#totalAmount');
            var balanceContainer = thisEl.find('#balance');
            var shippingContainer = thisEl.find('#shippingExpenses');
            var resultForCalculate = thisEl.find('tr.productItem');

            var totalUntax = 0;
            var totalEls;
            var $currentEl;
            var quantity;
            var cost;
            var balance;
            var taxes;
            var total;
            var date;
            var dates = [];
            var i;
            var taxesTotal = 0;
            var totalShippment = 0;
            var tax;

            resultForCalculate.push(thisEl.find('#shippingRow'));

            totalEls = resultForCalculate.length;

            if (totalEls) {
                for (i = totalEls - 1; i >= 0; i--) {
                    $currentEl = $(resultForCalculate[i]);
                    //  quantity = $currentEl.find('[data-name="quantity"]').text();
                    cost = $currentEl.find('[data-name="price"] input').val() || $currentEl.find('[data-name="price"]').text() || '0';
                    quantity = this.quantityRetriver($currentEl);
                    cost = helpers.spaceReplacer(cost);
                    cost = parseFloat(cost) || 0;
                    cost = quantity * cost;
                    tax = parseFloat(helpers.spaceReplacer($currentEl.find('.taxes .sum').text() || $currentEl.find('[data-name="taxes"] .sum').text())) || 0;
                    taxesTotal += tax;
                    totalUntax += cost;
                    date = $currentEl.find('.datepicker').text();
                    dates.push(date);

                    if ($currentEl.attr('id') === 'shippingRow') {
                        totalShippment = cost;
                    }
                }
            }

            totalUntax = (totalUntax - totalShippment).toFixed(2);
            totalUntaxContainer.text(helpers.currencySplitter(totalUntax));
            totalUntax = parseFloat(helpers.spaceReplacer(totalUntax)) + totalShippment;

            totalShippment = totalShippment.toFixed(2);
            shippingContainer.text(helpers.currencySplitter(totalShippment));

            taxes = taxesTotal;
            taxes = taxes.toFixed(2);
            taxesContainer.text(helpers.currencySplitter(taxes));
            taxes = parseFloat(helpers.spaceReplacer(taxes));

            total = totalUntax + taxes;
            if (discount) {
                total = total - discount;
            }

            balance = total - (this.paid || 0);
            total = total.toFixed(2);
            balance = balance.toFixed(2);

            totalContainer.text(helpers.currencySplitter(total));

            balanceContainer.text(helpers.currencySplitter(balance));

            date = helpers.minFromDates(dates);
            thisEl.find('#minScheduleDate span').text(date);

            if (parseFloat(discount)) {
                if (parseFloat(total) < 0) {
                    discount = parseFloat(discount) + parseFloat(total);

                    this.$el.find('#discount').val(discount.toFixed(2));

                }
            }
        },

        addEditableClass: function ($tr) {
            $tr.find('input').attr('readonly', false);
            $tr.find('textarea').attr('readonly', false);
        },

        removeDisabled: function () {
            $('.discountPercentage').prop('disabled', false);
        },

        render: function (options) {
            var productsContainer;
            var totalAmountContainer;
            var $thisEl = this.$el;
            var model = this.parentModel ? this.parentModel.toJSON() : options ? options.model : '';
            var self = this;
            var products;
            var currency;
            var channel;
            var templ;
            var shipping;

            this.$dialogContainer = $('#dialogContainer').html() ? $('#dialogContainer') : $('#formContent');

            populate.get('#accountDd', '/chartOfAccount/getForDd', {}, 'name', this, true, true);
            populate.get('#shippingDd', '/shippingMethod/getForDd', {}, 'name', this, false, true);

            if (model) {
                products = model.products;
                currency = model.currency;
                channel = model.channel;
                shipping = model.sourceDocument && model.sourceDocument.shippingMethod ? model.sourceDocument.shippingMethod : model.shippingMethod;

                templ = _.template(ProductItemsEditList);

                $thisEl.html(templ({
                    model      : model,
                    forSales   : self.forSales,
                    expense    : this.expense,
                    notEditable: this.notEditable
                }));

                if (products) {
                    productsContainer = $thisEl.find('#productList');
                    productsContainer.append(_.template(ItemsEditList, {
                        products        : products,
                        shippingMethod  : shipping,
                        notEditable     : this.notEditable,
                        availableVisible: this.availableVisible,
                        forSales        : self.forSales,
                        currencySplitter: helpers.currencySplitter,
                        currency        : currency,
                        quotations      : self.quotations,
                        expense         : this.expense,
                        channel         : channel
                    }));
                    totalAmountContainer = $thisEl.find('#totalAmountContainer');
                    totalAmountContainer.append(_.template(totalAmount, {
                        model           : model,
                        forSales        : self.forSales,
                        balanceVisible  : this.visible,
                        discountVisible : this.discountVisible,
                        notEditable     : this.notEditable,
                        currencySplitter: helpers.currencySplitter
                    }));
                }

                
            } else {
                this.$el.html(this.template({
                    forSales   : self.forSales,
                    writeOff   : self.writeOff,
                    expense    : this.expense,
                    notEditable: this.notEditable
                }));

                totalAmountContainer = $thisEl.find('#totalAmountContainer');
                totalAmountContainer.append(_.template(totalAmount, {
                    model           : null,
                    forSales        : self.forSales,
                    balanceVisible  : this.visible,
                    discountVisible : this.discountVisible,
                    notEditable     : false,
                    currencySplitter: helpers.currencySplitter,
                    currencyClass   : helpers.currencyClass
                }));

            }

            return this;
        }
    });

    return ProductItemTemplate;
});
