define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/oemOrders/form/FormView',
    'text!templates/oemOrders/form/EditTemplate.html',
    'text!templates/oemOrders/form/ViewTemplate.html',
    'models/goodsInNotesModel',
    'views/oemOrders/orderRows/ProductItems',
    'common',
    'custom',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'services/showJournalEntries'
], function (Backbone, $, _, ParentView, EditTemplate, ViewTemplate, GoodsInNote, ProductItemView, common, Custom, dataService, populate, CONSTANTS, helpers, journalService) {

    var EditView = ParentView.extend({
        contentType: 'oemOrders',
        imageSrc   : '',
        template   : _.template(EditTemplate),
        forSales   : false,
        service    : false,
        el         : '.form-holder',

        initialize: function (options) {
            var modelObj;

            if (options) {
                this.visible = options.visible;
            }

            _.bindAll(this, 'render', 'saveItem');
            _.bindAll(this, 'render', 'deleteItem');


            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = '/oemOrders';
            this.responseObj = {};
            // this.editablePrice = this.currentModel.get('workflow').status === 'New' || false;
            this.warehouse = this.currentModel.get('warehouse');
            this.editable = options.editable || true;
            this.balanceVissible = false;
            modelObj = this.currentModel.toJSON();
            this.onlyView = (modelObj.workflow && modelObj.workflow.status === 'Done');
        },

        resetPrices: function (e) {
            var rowId = this.$el.find('.productItem');
            var priceList = this.$el.find('#priceList').attr('data-id');

            var rows = [];
            var body = {
                priceList: priceList,
                rows     : rows
            };
            var self = this;
            e.preventDefault();

            rowId.each(function () {
                var product = $(this).find('.productsDd').attr('data-id');
                var quantity = $(this).find('input#quantity').val();

                rows.push({
                    orderRowId: $(this).attr('data-id'),
                    product   : product,
                    quantity  : parseFloat(quantity)
                });
            });

            this.saveItem(function (err) {
                if (!err) {

                    dataService.postData('/priceList/resetPrices', body, function (err, data) {
                        var info = self.model.get('paymentInfo');
                        if (data) {
                            data.rows.forEach(function (row) {
                                var existedProduct = _.findWhere(self.model.get('products'), {_id: row.orderRowId});

                                if (!existedProduct) {
                                    existedProduct = {};
                                }

                                existedProduct.subTotal = helpers.currencySplitter(row.priceAll.toFixed(2));
                                existedProduct.unitPrice = helpers.currencySplitter(row.price.toFixed(2));
                                existedProduct.quantity = row.quantity;

                            });
                            info.total = helpers.currencySplitter(data.info ? data.info.total.toFixed(2) : '0');
                            info.unTaxed = helpers.currencySplitter(data.info ? data.info.total.toFixed(2) : '0');

                        }

                        self.ProductItemView.render();

                    });
                }
            });

        },

        cancelOrder: function (e) {
            var self = this;
            var canceledObj;

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            canceledObj = _.find(this.responseObj['#workflowsDd'], function (el) {
                return el.status === 'Cancelled';
            });

            if (this.currentModel.toJSON().workflow.status === 'Done') {
                canceledObj = this.currentModel.toJSON().workflow;
            }

            self.currentModel.save({
                workflow: canceledObj._id
                // cancel  : true
            }, {
                headers: {
                    mid: 57
                },
                patch  : true,
                success: function () {
                    var url = window.location.hash;

                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');
            var id = $target.attr('id');
            var $targetElement = $(e.target).closest('a');
            var symbol;
            var currency;
            var self = this;

            if ($target.closest('a').attr('id') === 'currencyDd') {
                currency = _.findWhere(this.responseObj['#currencyDd'], {_id: $target.attr('id')});
                symbol = currency ? currency.currency : '$';
                $targetElement.attr('data-symbol', symbol);
                $targetElement.text($(e.target).text());
                $targetElement.attr('data-id', id);
                this.$el.find('.currencySymbol').text(symbol);
            } else if ($target.closest('a').attr('id') === 'workflowsDd' && $(e.target).attr('data-status') === 'cancelled') {
                this.cancelOrder(e);
            }

            else if (holder.attr('id') === 'supplierDd') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectContract($(e.target).attr('id'));
            }

            $targetElement.text($(e.target).text()).attr('data-id', id);

            this.hideNewSelect();
        },

        selectContract: function (id) {

            if (id !== '') {
                dataService.getData( '/purchaseContract/getForDd', {
                    supplier : id
                }, function (response, context) {
                    var contract = response.data;

                    if (contract) {
                        var purchaseContract;

                        purchaseContract = _.map(contract, function (contract) {
                            purchaseContract = {
                                _id   : contract._id,
                                name  : contract.number
                            }

                            return purchaseContract;
                        });

                        context.responseObj['#purchaseContract'] = purchaseContract;                       

                    }
                }, this);
            } else {
                this.$el.find('#purchaseContract').val('');
            }
        },

        saveOrder: function (e) {
            e.preventDefault();
            this.saveItem();
        },

        saveItem: function (invoiceCb) {
            var self = this;
            var mid = 129;
            var thisEl = this.$el;
            var selectedProducts = thisEl.find('.productItem');
            var products = [];
            var data;
            var selectedLength = selectedProducts.length;
            var targetEl;
            var quantity;
            var price;
            var description;
            var subTotal;
            var scheduledDate;
            var taxes;
            var supplier = thisEl.find('#supplierDd').attr('data-id');
            var orderRows = this.model.get('products');
            var paymentMethod = $.trim(thisEl.find('#paymentMethod').attr('data-id')) || null;
            var destination = $.trim(thisEl.find('#destination').data('id'));
            var priceList = $.trim(thisEl.find('#priceList').data('id'));
            var paymentTerm = $.trim(thisEl.find('#paymentTerm').data('id'));
            var fiscalPosition = $.trim(thisEl.find('#fiscalPosition').data('id'));
            var supplierReference = thisEl.find('#supplierReference').val();
            var orderDate = thisEl.find('#orderDate').val() || thisEl.find('#orderDate').text();
            var expectedDate = thisEl.find('#expectedDate').val() || thisEl.find('#expectedDate').text();
            var assignedTo = $.trim(thisEl.find('#assignedTo').attr('data-id'));
            var creditAccount = $.trim(thisEl.find('#account').attr('data-id'));
            var workflowStatus = $.trim(thisEl.find('#workflowsDd').text());
            var warehouse = $.trim(thisEl.find('#warehouseDd').attr('data-id'));
            var contract = $.trim(thisEl.find('#purchaseContract').attr('data-id'));

            var total = helpers.spaceReplacer($.trim(thisEl.find('#totalAmount').text()));
            var totalTaxes = helpers.spaceReplacer($.trim(thisEl.find('#taxes').text()));
            var unTaxed = helpers.spaceReplacer($.trim(thisEl.find('#totalUntaxes').text()));
            var discount = helpers.spaceReplacer($.trim(thisEl.find('#discount').val()));
            var workflow = $.trim(thisEl.find('#workflowsDd').attr('data-id'));
            var account;
            var currency;
            var allocateProducts = [];
            var cost;
            var i;
            var orderRow;
            var id;
            var taxCode;
            var shippingAmount;
            var shippingAccount;
            var shippingId;
            var modelObj = this.currentModel.toJSON();
            var vicePrice;
            var parameters;

            if (!warehouse) {
                return App.render({
                    type   : 'error',
                    message: "仓库不可为空！"
                });
            }

            if (!assignedTo) {
                return App.render({
                    type   : 'error',
                    message: "经办人不可为空！"
                });
            }

            unTaxed = parseFloat(unTaxed) * 100;
            total = parseFloat(total) * 100;
            totalTaxes = parseFloat(totalTaxes) * 100;
            discount = parseFloat(discount) * 100;

            if (thisEl.find('#currencyDd').attr('data-id')) {
                currency = {
                    _id : thisEl.find('#currencyDd').attr('data-id'),
                    name: thisEl.find('#currencyDd').text()
                };
            } else {
                currency = {
                    _id : App.organizationSettings && App.organizationSettings.currency ? App.organizationSettings.currency._id : 'USD',
                    name: App.organizationSettings && App.organizationSettings.currency ? App.organizationSettings.currency.name : 'USD'
                };
            }

            shippingId = thisEl.find('#shippingDd').attr('data-id');
            shippingAccount = thisEl.find('#shippingRow').find('.accountDd').attr('data-id');
            shippingAmount = helpers.spaceReplacer(thisEl.find('#shippingRow').find('[data-name="price"] input').val()) || helpers.spaceReplacer(thisEl.find('#shippingRow').find('[data-name="price"] span:not(.currencySymbol)').text());

            shippingAmount = parseFloat(shippingAmount) * 100;
            if (selectedLength && !this.onlyView) {
                if (shippingId || shippingAccount) {
                    selectedLength += 1;
                }

                for (i = selectedLength - 1; i >= 0; i--) {
                    targetEl = selectedProducts.length === i ? this.$el.find('#shippingRow') : $(selectedProducts[i]);
                    id = targetEl.data('id');
                    account = targetEl.find('.accountDd').attr('data-id');
                    taxCode = targetEl.find('.current-selected.taxCode').attr('data-id');
                    code = targetEl.find('.productsDd').attr('id');

                    quantity = $.trim(targetEl.find('[data-name="quantity"]').text()) || targetEl.find('[data-name="quantity"] input').val();
                    quantity = parseFloat(quantity);
                    price = helpers.spaceReplacer(targetEl.find('[data-name="price"] input').val()) || helpers.spaceReplacer(targetEl.find('[data-name="price"] span').text());
                    price = parseFloat(price) * 100;
                    scheduledDate = $.trim(targetEl.find('[data-name="scheduledDate"]').text());
                    taxes = helpers.spaceReplacer($.trim(targetEl.find('[data-name="taxes"] .sum').text()));
                    taxes = parseFloat(taxes) * 100;
                    cost = helpers.spaceReplacer($.trim(targetEl.find('[data-name="cost"] .sum').text()));
                    cost = parseFloat(cost) * 100;
                    description = targetEl.find('textarea.productDescr').val() || targetEl.find('[data-name="productDescr"]').text();

                    subTotal = helpers.spaceReplacer($.trim(targetEl.find('.subtotal .sum').text()));
                    subTotal = parseFloat(subTotal) * 100;

                    parameters = modelObj.products[i].parameters;
                    var valueExist = false;
                    parameters.forEach(function(elem){
                        if(elem.paraname == "副计量单价"){
                            valueExist = true;
                            vicePrice = elem.value;
                        }
                    });

                    if(valueExist == false){
                        vicePrice =parseFloat(targetEl.find('[data-name="price2"] input').val());
                        parameters.push({"paraname":"副计量单价", "value": vicePrice});
                    } else if(vicePrice != parseFloat(targetEl.find('[data-name="price2"] input').val())){
                        parameters.pop();
                        vicePrice =parseFloat(targetEl.find('[data-name="price2"] input').val());
                        parameters.push({"paraname":"副计量单价", "value": vicePrice});
                    }

                    if (id) {
                        orderRow = _.findWhere(orderRows, {_id: id});

                        if (orderRow && orderRow.fulfilled && orderRow.fulfilled > quantity) {
                            quantity = orderRow.fulfilled;
                        }
                    }

                    if(subTotal == 0){
                        return App.render({
                            type   : 'error',
                            message: "产品总价不可为零！"
                        });
                    }

                    products.push({
                        id           : id,
                        warehouse    : warehouse,
                        costPrice    : cost,
                        unitPrice    : price,
                        quantity     : quantity,
                        scheduledDate: scheduledDate,
                        taxes        : [{
                            taxCode: taxCode || null,
                            tax    : taxes
                        }],

                        description  : description,
                        subTotal     : subTotal,
                        debitAccount : account || null,
                        creditAccount: creditAccount || null,
                        taxCode      : taxCode || null,
                        totalTaxes   : taxes || 0,
                        parameters   : parameters
                    });
                    
                }
            }
            data = {
                currency         : currency,
                supplier         : supplier,
                supplierReference: supplierReference,
                paymentMethod    : paymentMethod,
                contract         : contract,
                priceList        : priceList,
                warehouse        : warehouse,
                expectedDate     : expectedDate,
                destination      : destination || null,
                invoiceControl   : priceList || null,
                paymentTerm      : paymentTerm || null,
                fiscalPosition   : fiscalPosition || null,
                workflow         : workflow,
                salesPerson      : assignedTo,
                shippingMethod   : shippingId,
                shippingExpenses : {
                    account: shippingAccount,
                    amount : shippingAmount
                },

                paymentInfo: {
                    total   : total,
                    unTaxed : unTaxed + shippingAmount,
                    taxes   : totalTaxes,
                    discount: discount
                }
            };

            if (this.currentModel.toJSON().orderDate !== orderDate) {
                orderDate = helpers.setTimeToDate(orderDate);

                data.orderDate = orderDate;
            }

            if (!this.onlyView) {
                data.orderRows = products;
            }

            this.model.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function () {
                    function callBack() {
                        var hash = window.location.hash;

                        if (invoiceCb && typeof invoiceCb === 'function') {
                            return self.model.fetch({
                                success: function () {
                                    invoiceCb(null);
                                }
                            });

                        }

                        Backbone.history.fragment = '';
                        Backbone.history.navigate(hash, {trigger: true});
                        self.hideDialog();
                    }

                    if (allocateProducts && allocateProducts.length) {
                        self.createAllocation(allocateProducts, callBack);
                    } else {
                        callBack();
                    }

                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);

                    if (invoiceCb && typeof invoiceCb === 'function') {
                        return invoiceCb(xhr.text);
                    }
                }
            });
        },

        render: function () {
            var self = this;
            var $thisEl = this.$el;
            var formString;
            var productItemContainer;

            this.template = _.template(EditTemplate);

            if (this.onlyView/* && this.currentModel.toJSON().status.fulfillStatus === 'ALL'*/) {
                $('.saveBtn').addClass('hidden');
                this.template = _.template(ViewTemplate);
            } else {
                $('.saveBtn').removeClass('hidden');
            }

            formString = this.template({
                model   : this.currentModel.toJSON(),
                visible : this.visible,
                onlyView: this.onlyView,
                forSales: this.forSales,
                common : common
            });

            $thisEl.html(formString);

            

            

            this.delegateEvents(this.events);

            if (!this.onlyView/* || this.currentModel.toJSON().status.fulfillStatus !== 'ALL'*/) {

                populate.get('#currencyDd', CONSTANTS.URLS.CURRENCY_FORDD, {}, 'name', this, true);
                populate.get('#destination', '/destination', {}, 'name', this, false, true);
                populate.get('#priceList', 'priceList/getForDd', {cost: true}, 'name', this, false, true);
                populate.get('#invoicingControl', '/invoicingControl', {}, 'name', this, false, true);
                populate.get('#paymentTerm', '/paymentTerm', {}, 'name', this, false, true);
                populate.get('#deliveryDd', '/deliverTo', {}, 'name', this, false, true);
                populate.get2name('#supplierDd', CONSTANTS.URLS.SUPPLIER, {}, this, false, false);
                populate.getWorkflow('#workflowsDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {
                    id    : 'oem Order',
                    status: {$ne: 'Done'}
                }, 'name', this);
                populate.get('#paymentMethod', '/paymentMethod', {}, 'name', this, false, true, null);
                populate.get('#account', '/chartOfAccount/getForDd', {}, 'name', this, false, true);
                populate.get('#taxCode', '/taxSettings/getForDd', {}, 'name', this, true, true);
                populate.get('#warehouseDd', '/warehouse', {}, 'name', this, false, true);
                //populate.get('#purchaseContract', 'purchaseContract/getForDd', {_type: 'purchaseContract'}, 'number', this, false, true);

                this.$el.find('#expectedDate').datepicker({
                    dateFormat: 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                    minDate    : new Date()
                });

                this.$el.find('#orderDate').datepicker({
                    dateFormat: 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                    onSelect   : function (date) {
                        self.$el.find('#expectedDate').datepicker('option', 'minDate', new Date(date));

                        if (self.$el.find('#expectedDate').val() < self.$el.find('#orderDate').val()) {
                            self.$el.find('#expectedDate').datepicker('setDate', new Date(date));
                        }
                    }
                });

                dataService.getData('/employees/getForDD', {isEmployee: true}, function (employees) {
                    employees = _.map(employees.data, function (employee) {
                        employee.name = employee.name.first + ' ' + employee.name.last;

                        return employee;
                    });

                    self.responseObj['#assignedTo'] = employees;
                });

            }

            productItemContainer = this.$el.find('#productItemsHolder');

            if (this.onlyView) {
                this.notEditable = true;
            }

            this.ProductItemView = new ProductItemView({
                notEditable     : self.notEditable,
                editablePrice   : self.editablePrice,
                balanceVissible : self.balanceVissible,
                parentModel     : self.model,
                discountVisible : true,
                availableVisible: true,
                forSales        : true,
                canBeSold       : true,
                service         : self.service,
                warehouse       : this.warehouse,
                responseObj     : this.responseObj
            });

            productItemContainer.append(
                self.ProductItemView.render().el
            );

            if(this.currentModel.toJSON().paymentInfo.total == 0){
                this.ProductItemView.recalculateDiscount();
            }

            return this;
        }

    });

    return EditView;
});
