define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/purchaseOrders/form/FormView',
    'text!templates/purchaseOrders/form/EditTemplate.html',
    'text!templates/purchaseOrders/form/ViewTemplate.html',
    'models/goodsInNotesModel',
    'views/Products/orderRows/ProductItems',
    'views/goodsInNotes/CreateView',
    'views/Payment/CreateView',
    'common',
    'custom',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'services/showJournalEntries'
], function (Backbone, $, _, ParentView, EditTemplate, ViewTemplate, GoodsInNote, ProductItemView, CreateView, PaymentCreateView, common, Custom, dataService, populate, CONSTANTS, helpers, journalService) {

    var EditView = ParentView.extend({
        contentType: 'purchaseOrders',
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
            this.currentModel.urlRoot = '/purchaseOrders';
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

            if (holder.attr('id') === 'supplierDd') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                var spid = $(e.target).attr('id');
                this.getContract(spid);
            }

            $targetElement.text($(e.target).text()).attr('data-id', id);

            this.hideNewSelect();
        },

        getContract: function (id) {
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
                        if(purchaseContract.length){
                            context.responseObj['#purchaseContract'] = purchaseContract;
                        } else{
                            context.$el.find('#purchaseContract').text('无').attr('data-id','');
                            return App.render({
                                type   : 'notify',
                                message: '该供应商没有对应材料采购合同。'
                            });
                        }
                    }
                }, this);
            } else {
                this.$el.find('#purchaseContract').val('');
            }
        },

        catchPrices: function() {
            var self = this;
            var Contractid = this.$el.find('#purchaseContract').attr('data-id');
            var date = this.$el.find('#orderDate').val() || this.$el.find('#orderDate').text();
            if(!Contractid){
                return App.render({
                    type   : 'error',
                    message: '请先选择采购合同！'
                    });
            } else{
                dataService.getData( 'purchaseOrders/catchPrices', {
                    id      : Contractid,
                    date    : date
                }, function (response, context) {
                    if(response && response.error){
                        var tempMessage = response.error.responseJSON.error.split('Error');
                        var message = tempMessage[0];
                        return App.render({
                            type   : 'error',
                            message: message
                        });
                    } else if(response && response.products && response.products[0].average){
                        var products = response.products;
                        var $thisEl = self.$el;
                        var $table = $thisEl.find('#productList');
                        var $products;
                        var subtotal = 0;
                        $products = $table.find('tr.productItem');
                        $.each($products, function () {
                            var flag = false;
                            var id = $(this).find('[data-name="productName"] div a').attr('data-id');
                            var name = $(this).find('[data-name="productName"] div a').text();
                            var quantity = $(this).find('#quantity').val() || $(this).find('td[data-name="quantity"]').text();
                            var priceQty = $(this).find('#priceQty').val() || $(this).find('td[data-name="priceQty"]').text();
                            var total;
                            var price = 0;   
                            products.forEach(function (product) {
                                if(id == product.product._id){
                                    flag = true;
                                    if(product.price1){
                                        price += product.price1;
                                    }
                                    if(product.price2){
                                        price += product.price2;
                                    }
                                    if(product.price3){
                                        price += product.price3;
                                    }
                                    if(product.price4){
                                        price += product.price4;
                                    }
                                    if(product.price5){
                                        price += product.price5;
                                    }
                                    if(product.average){
                                        price += product.average;
                                    }
                                    if(priceQty != 0) {
                                        total = price * priceQty;
                                    }else{
                                        total = 0;
                                    }
                                    subtotal += total;
                                }
                               
                            });
                            if(flag == false){
                                return App.render({
                                    type   : 'error',
                                    message: '产品'+ name +'采购合同中未设置！'
                                    });
                            } else{
                                $(this).find('[data-name="price"] div #editInput').val(price/1000);
                                $(this).find('[data-name="subtotal"] div .sum').text((total/1000).toFixed(2));
                            }
                        });
                        $thisEl.find('#totalAmount').text((subtotal/1000).toFixed(2));
                    }
                },this);
            }
        },

        saveOrder: function (e) {
            e.preventDefault();
            this.saveItem();
        },

        receiveInvoice: function (e) {
            var self = this;
            var url = '/purchaseInvoices/receive';
            var journal = CONSTANTS.INVOICE_PURCHASE;
            var data = {
                forSales: this.forSales,
                orderId : this.currentModel.id,
                currency: this.currentModel.currency,
                journal : journal
            };
            var creditAccount = this.$el.find('#account').attr('data-id');
            var stockReceivedNotInvoiced = _.findWhere(this.responseObj['#account'], {_id: CONSTANTS.STOCK_RECEIVED_NOT_INVOICED});

            if (!this.onlyView && creditAccount !== CONSTANTS.STOCK_RECEIVED_NOT_INVOICED) {
                this.$el.find('#account').text(stockReceivedNotInvoiced.name).attr('data-id', stockReceivedNotInvoiced._id);
            }

            creditAccount = this.$el.find('#account').attr('data-id');

            if (!creditAccount) {
                return App.render({
                    type   : 'notify',
                    message: '请先选择应付应计账户。'
                });
            }

            e.preventDefault();
            e.stopPropagation();

            this.saveItem(function (err) {
                if (!err) {
                    dataService.postData(url, data, function (err) {
                        var redirectUrl = 'easyErp/purchaseInvoices';

                        if (err) {
                            App.render({
                                type   : 'error',
                                message: '无法收到发票'
                            });
                        } else {
                            Backbone.history.navigate(redirectUrl, {trigger: true});
                        }
                    });
                }
            });
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
            var productId;
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
            var defaultorderDate = this.model.get('orderDate');
            var Newnote = thisEl.find('#notes').val();
            var notes = this.model.get('notes');

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

            if (!paymentMethod) {
                return App.render({
                    type   : 'error',
                    message: "银行账户不可为空！"
                });
            }

            if (!warehouse) {
                return App.render({
                    type   : 'error',
                    message: "仓库不可为空！"
                });
            }

            notes = notes.filter(function (elem) {
                return !elem.history && !elem.pay;
            });

            if(defaultorderDate.trim() !== orderDate.trim()) {
                if(!Newnote){
                    return App.render({
                        type   : 'error',
                        message: "日期已修改，请填写备注信息！"
                    });
                } else{
                    notes.push({note:Newnote, date:new Date()});
                }
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
                    productId = targetEl.find('.productsDd').attr('data-id');
                    account = targetEl.find('.accountDd').attr('data-id');
                    taxCode = targetEl.find('.current-selected.taxCode').attr('data-id');
                    code = targetEl.find('.productsDd').attr('id');

                    if (productId || shippingAccount) {  // added more info for save

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

                        if (id) {
                            orderRow = _.findWhere(orderRows, {_id: id});

                            if (orderRow && orderRow.fulfilled && orderRow.fulfilled > quantity) {
                                quantity = orderRow.fulfilled;
                            }
                        }

                        products.push({
                            id           : id,
                            warehouse    : warehouse,
                            product      : productId,
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
                            totalTaxes   : taxes || 0
                        });
                    }
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
                notes            : notes,
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

            if (supplier) {
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

            } else {
                App.render({
                    type   : 'error',
                    message: CONSTANTS.RESPONSES.CREATE_QUOTATION
                });
            }
        },

        receiveInventory: function (e) {
            var self = this;
            var creditAccount = this.$el.find('#account').attr('data-id');
            var stockReceivedNotInvoiced = _.findWhere(this.responseObj['#account'], {_id: CONSTANTS.STOCK_RECEIVED_NOT_INVOICED});

            e.preventDefault();

            if (!this.onlyView && creditAccount !== CONSTANTS.STOCK_RECEIVED_NOT_INVOICED && stockReceivedNotInvoiced) {
                this.$el.find('#account').text(stockReceivedNotInvoiced.name).attr('data-id', stockReceivedNotInvoiced._id);
            }

            creditAccount = this.$el.find('#account').attr('data-id');

            if (!creditAccount) {
                return App.render({
                    type   : 'notify',
                    message: '请先选择支付银行账户！'
                });
            }

            this.saveItem(function () {
                return new CreateView({orderModel: self.model});
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
                    id    : 'Purchase Order',
                    status: {$ne: 'Done'}
                }, 'name', this);
                populate.get('#paymentMethod', '/paymentMethod', {}, 'name', this, false, true, null);
                populate.get('#account', '/chartOfAccount/getForDd', {}, 'name', this, false, true);
                populate.get('#taxCode', '/taxSettings/getForDd', {}, 'name', this, true, true);
                populate.get('#warehouseDd', '/warehouse', {}, 'name', this, false, true);

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
            var spid = this.$el.find('#supplierDd').attr('data-id');
            if(spid){
                this.getContract(spid);
            }
            if(this.currentModel.toJSON().workflow.status!=='New'){
                var array=this.$('input');
                var array1=this.$el.find('a');           
                $.each(this.$el.find('a'),function(i,v){
                    if( $(v).hasClass("current-selected")){
                        $(v).removeClass("current-selected");
                    }               
                })
                this.$el.find('#workflowsDd').addClass("current-selected")
                for(var index in array){
                    array[index].disabled=true;
                }
                $('#catchPrices')[0].hidden="hidden";
                $('#selectShippingMethod')[0].hidden="hidden";
                $('#resetPrices')[0].hidden="hidden";
            }
            this.$el.find('.productsDd').removeClass("current-selected");

            return this;
        }

    });

    return EditView;
});
