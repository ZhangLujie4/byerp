define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/oemOrders/orderRows/ProductItemsEditList.html',
    'text!templates/oemOrders/orderRows/ItemsEditList.html',
    'text!templates/oemOrders/orderRows/TotalAmount.html',
    'collections/Products/products',
    'views/Projects/projectInfo/wTracks/generateWTrack',
    'views/selectView/selectView',
    'populate',
    'helpers',
    'dataService',
    'constants',
    'async',
    'helpers/keyValidator',
    'custom'
], function (Backbone,
             $,
             _,
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
             keyValidator,
             custom) {
    'use strict';
    var ProductItemTemplate = Backbone.View.extend({

        events: {
            'click .newSelectList li:not(.miniStylePagination, #createNewEl)'         : 'chooseOption',
            'click .newSelectList li.miniStylePagination'                             : 'notHide',
            'click .newSelectList li.miniStylePagination .next:not(.disabled)'        : 'nextSelect',
            'click .newSelectList li.miniStylePagination .prev:not(.disabled)'        : 'prevSelect',
            'click .current-selected.productsDd'                                      : 'showProductsSelect',
            'mouseenter .editable:not(.quickEdit), .editable .no-long:not(.quickEdit)': 'quickEdit',
            'mouseleave .editable'                                                    : 'removeEdit',
            'click #cancelSpan'                                                       : 'cancelClick',
            'click #saveSpan'                                                         : 'saveClick',
            'click #editSpan'                                                         : 'editClick',
            'keyup td[data-name=price],td[data-name=quantity],td[data-name=priceQty] input'                  : 'priceChange',
            'keypress  .forNum'                                                       : 'keypressHandler',
            'keyup #discount'                                                         : 'recalculateDiscount',
            'click .productItem'                                                      : 'renderMessage'
        },

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

            this.priceChange = _.debounce(this.priceChange, 250);
        },

        closeSelect: function (e) {
            $('.newSelectList').remove();
        },

        renderMessage: function (e) {
            var $target = $(e.target);
            var $tr = $target.closest('tr');
            var productOrJob = 'product';

            if (this.expense) {
                return false;
            }

            if ($target.hasClass('current-selected') || $target.hasClass('productDescr') || $target.closest('ul').length) {
                return false;
            }

            if ($tr.attr('data-error') || ($tr.find('a.jobs').attr('data-id') === 'jobs')) {
                return App.render({
                    type   : 'error',
                    message: 'Please, choose ' + productOrJob + ' first.'
                });
            }
        },

        keypressHandler: function (e) {

            if ($(e.target).closest('input').hasClass('quantity')) {
                return keyValidator(e);
            }
            
            return keyValidator(e, true);
        },

        filterProductsForDD: function () {
            var id = '.productsDd';
            var self = this;
            var products = this.products.toJSON();

            this.responseObj[id] = products;

            /*this.responseObj[id] = [];
             this.responseObj[id] = this.responseObj[id].concat(_.map(products, function (item) {
             return {_id: item._id, name: item.name, level: item.projectShortDesc || ''};
             }));*/
        },

        priceChange: function (e) {
            var $targetEl = $(e.target);
            var parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var val;

            if (!inputEl.length) {
                inputEl = parent.find('textarea');
            }
            val = inputEl.val();

            e.preventDefault();

            if (!val.length) {
                val = '0';
                inputEl.val(val);
            }

            parent.addClass('changedPrice');

            this.recalculateDiscount(e);
            this.recalculate(parent);
        },

        showProductsSelect: function (e) {
            var $target = $(e.target);

            e.stopPropagation();

            if ($target.attr('id') === 'selectInput') {
                return false;
            }

            if (this.selectView) {
                this.selectView.remove();
            }

            this.selectView = new SelectView({
                e          : e,
                responseObj: this.responseObj
            });

            $target.append(this.selectView.render().el);

            return false;
        },

        chooseOption: function (e) {
            var self = this;
            var $target = $(e.target).closest('li');
            var $parrent = $target.parents('td');
            var $trEl = $target.parents('tr.productItem');
            var $infoTr = $trEl.next();
            var $variants = $target.find('span.variants');
            var $quantityContainer = $trEl.find('[data-name="quantity"]');
            var $descriptionContainer = $trEl.find('.productDescr');
            var $descriptionDiv = $infoTr.find('.fullfilledHolder');
            var $subtotalContainer = $trEl.find('[data-name="subtotal"] .sum');
            var $costContainer = $trEl.find('[data-name="cost"] .sum');
            var $quantity = $quantityContainer.find('input');
            var $parrents = $trEl.find('td');
            var _id = $target.attr('id');
            var quantity = $quantity.val() || 1;
            var salePrice = 0;
            var description;
            var model;
            var total;
            var subtotal;
            var selectedProduct;
            var jobId;
            var currentJob;
            var product = $trEl.find('.productsDd');
            var currency = {};
            var priceList = this.$dialogContainer.find('#priceList').attr('data-id');
            var costList = this.$dialogContainer.find('#costList').attr('data-id');
            var warehouse = this.$dialogContainer.find('#warehouseDd').attr('data-id');
            var parallelTasks;
            var variant;

            function getPrices(pCb) {
                dataService.getData('/priceList/getPrices', {
                    product  : _id,
                    costList : costList,
                    priceList: priceList,
                    quantity : quantity
                }, function (data) {
                    pCb(null, data);
                });
            }

            parallelTasks = [getPrices];

            if (this.availableVisible) {
                parallelTasks.push(getAvailability);
            }

            async.parallel(parallelTasks, function (err, resp) {
                var data = resp[0];
                var cost = resp[1];

                var priceEl = cost || data.price || 0;

                $quantity.val(quantity);
                $trEl.attr('data-error', null);
                $trEl.find('#editInput').val(priceEl.toFixed(2));

                currency._id = $('#currencyDd').attr('data-id');

                total = parseFloat(priceEl.toFixed(2) * quantity);
                subtotal = total;
                subtotal = subtotal.toFixed(2);

                $taxesContainer.text(taxes);
                $subtotalContainer.text(subtotal);

                $('.newSelectList').remove();

                self.removeDisabled();
                self.recalculateDiscount();
            });
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

        priceQtyRetriver: function ($parent) {
            var selectedProduct = this.products || new Backbone.Collection();
            var id;
            var priceQty;

            $parent = $parent.closest('tr');
            id = $parent.attr('data-id');

            selectedProduct = selectedProduct.get(id) || null;

            if (selectedProduct && selectedProduct.get('name') === CONSTANTS.IT_SERVICES) {
                quantity = 1;
            } else {
                priceQty = $parent.find('#priceQty').val() || $parent.find('td[data-name="priceQty"]').text();
            }

            priceQty = this.isNaN(priceQty);

            return priceQty;
        },

        recalculate: function ($parent) {
            var quantity = this.quantityRetriver($parent);
            var total;
            var cost;
            var priceQty;
            var subtotal;

            $parent = $parent.closest('tr');

            cost = $parent.find('[data-name="price"] input').val() || $parent.find('[data-name="price"]').text();
            cost = parseFloat(helpers.spaceReplacer(cost)) || 0;
            priceQty = $parent.find('#priceQty').val() || $parent.find('td[data-name="priceQty"]').text();
            if(priceQty != 0) {
                total = cost * priceQty;
            }else{
                total = 0;
            }
            subtotal = total;

            subtotal = subtotal.toFixed(2);
            $parent.find('.subtotal .sum').text(helpers.currencySplitter(subtotal));

            this.recalculateDiscount(null);
        },

        recalculateDiscount: function (e) {
            var $target = e ? $(e.target) : this.$el.find('#discount');
            var parentTr = $target.closest('tr');
            var quantity = parseInt($target.val(), 10) || 0;
            var cost = parseFloat(helpers.spaceReplacer(this.$el.find('#totalUntaxes').text()));
            var discount = quantity;
            discount = discount.toFixed(2);

            parentTr.find('#discountSum').text(helpers.currencySplitter(discount));

            this.calculateTotal(discount);
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
            var priceQty;
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
                    priceQty = this.priceQtyRetriver($currentEl);
                    cost = helpers.spaceReplacer(cost);
                    cost = parseFloat(cost) || 0;
                    if(priceQty != 0) {
                        cost = cost * priceQty;
                    }else{
                        cost = 0;
                    }
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

                    this.recalculateDiscount(null);
                }
            }
        },

        nextSelect: function (e) {
            this.showProductsSelect(e, false, true);
        },

        prevSelect: function (e) {
            this.showProductsSelect(e, true, false);
        },

        removeEditableCass: function ($tr) {
            $tr.find('input').attr('readonly', true);
            $tr.find('textarea').attr('readonly', true);
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
            console.log(this.expense);

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
            }

            return this;
        }
    });

    return ProductItemTemplate;
});
