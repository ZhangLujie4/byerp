define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/purchaseOrders/CreateTemplate.html',
    'collections/Persons/PersonsCollection',
    'collections/Departments/DepartmentsCollection',
    'views/dialogViewBase',
    'views/Products/orderRows/ProductItems',
    'models/orderModel',
    'common',
    'populate',
    'constants',
    'views/Assignees/AssigneesView',
    'dataService',
    'helpers/keyValidator',
    'helpers'
], function (Backbone,
             $,
             _,
             CreateTemplate,
             PersonsCollection,
             DepartmentsCollection,
             ParentView,
             ProductItemView,
             OrderModel,
             common,
             populate,
             CONSTANTS,
             AssigneesView,
             dataService,
             keyValidator,
             helpers) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'purchaseOrders',
        template   : _.template(CreateTemplate),
        forSales   : false,

        initialize: function (options) {
            if (options) {
                this.visible = options.visible;
            }
            _.bindAll(this, 'saveItem', 'render');
            this.model = new OrderModel();
            this.responseObj = {};
            this.currencySymbol = '￥';

            this.render();
        },

        events: {
            'keypress .forNum'                                               : 'keydownHandler',
            'click .newSelectList li:not(.miniStylePagination,#generateJobs)': 'chooseOption'
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var id = $target.attr('id');
            var symbol;
            var currency;
            var warehouse;
            var account;
            var table = this.$el.find('.list');
            var trs = table.find('tr');
            var accountObj;

            if ($target.closest('a').attr('id') === 'currencyDd') {
                currency = _.findWhere(this.responseObj['#currencyDd'], {_id: $target.attr('id')});
                symbol = currency ? currency.currency : '$';
                $target.closest('dd').find('.current-selected').attr('data-symbol', symbol);
                this.$el.find('.currencySymbol').text(symbol);
                this.currencySymbol = symbol;
                populate.get('#costList', 'priceList/getForDd', {currency: id}, 'name', this, true, true);
                populate.get('#priceList', 'priceList/getForDd', {currency: id}, 'name', this, true, true);

            } else if ($target.closest('a').attr('id') === 'warehouseDd') {
                warehouse = _.findWhere(this.responseObj['#warehouseDd'], {_id: $target.attr('id')});
                account = warehouse ? warehouse.account : null;
                accountObj = _.findWhere(this.responseObj['#account'], {_id: account});

                if (accountObj && accountObj._id) {
                    trs.each(function () {
                        $(this).find('.accountDd').text(accountObj.name).attr('data-id', accountObj._id);
                    });
                }
            }

            $target.parents('ul').closest('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));

            this.hideNewSelect();

            return false;
        },

        saveItem: function () {
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
            var shippingId;
            var shippingAmount;
            var shippingAccount;

            var forSales = this.forSales || false;

            var currency = {
                _id : thisEl.find('#currencyDd').attr('data-id'),
                name: $.trim(thisEl.find('#currencyDd').text())
            };

            var supplier = thisEl.find('#customerDd').attr('data-id');
            var paymentMethod = $.trim(thisEl.find('#paymentMethod').attr('data-id'));
            var destination = $.trim(thisEl.find('#destination').attr('data-id'));
            var assignedTo = $.trim(thisEl.find('#assignedTo').attr('data-id'));
            var deliverTo = $.trim(thisEl.find('#deliveryDd').attr('data-id'));
            var paymentTerm = $.trim(thisEl.find('#paymentTerm').attr('data-id'));
            var workflow = $.trim(thisEl.find('#workflowsDd').attr('data-id'));
            var fiscalPosition = $.trim(thisEl.find('#fiscalPosition').attr('data-id'));
            var priceList = $.trim(thisEl.find('#priceList').data('id'));
            var warehouse = $.trim(thisEl.find('#warehouseDd').data('id'));
            var project = thisEl.find('#projectDd').attr('data-id');
            var building = thisEl.find('#building').val();

            var orderDate = thisEl.find('#orderDate').val();
            var expectedDate = thisEl.find('#expectDate').val() || thisEl.find('#orderDate').val();
            var creditAccount = $.trim(thisEl.find('#account').attr('data-id'));

            var total = helpers.spaceReplacer($.trim(thisEl.find('#totalAmount').text()));
            var totalTaxes = helpers.spaceReplacer($.trim(thisEl.find('#taxes').text()));
            var taxes;
            var description;
            var unTaxed = helpers.spaceReplacer($.trim(thisEl.find('#totalUntaxes').text()));
            var discount = helpers.spaceReplacer($.trim(thisEl.find('#discount').val()));
            var subTotal;
            var jobs;
            var cost;
            var account;
            var taxCode;
            var UOM;
            var priceQty;

            var usersId = [];
            var groupsId = [];
            var i;
            var status = {
                fulfillStatus: 'NOR'
            };

            var whoCanRW = this.$el.find("[name='whoCanRW']:checked").val();

            shippingId = thisEl.find('#shippingDd').attr('data-id');
            shippingAccount = thisEl.find('#shippingRow').find('.accountDd').attr('data-id');
            shippingAmount = helpers.spaceReplacer(thisEl.find('#shippingRow').find('[data-name="price"] input').val()) || helpers.spaceReplacer(thisEl.find('#shippingRow').find('[data-name="price"] span:not(.currencySymbol)').text());

            shippingAmount = parseFloat(shippingAmount) * 100;

            total = parseFloat(total) * 100;
            unTaxed = parseFloat(unTaxed) * 100;
            totalTaxes = parseFloat(totalTaxes) * 100;
            discount = parseFloat(discount) * 100;

            if (!selectedLength) {
                return App.render({
                    type   : 'error',
                    message: "产品不可为空！"
                });
            }

            if (!paymentMethod) {
                return App.render({
                    type   : 'error',
                    message: "银行账户不可为空！"
                });
            }

            if (shippingId || shippingAccount) {
                selectedLength += 1;
            }

            for (i = selectedLength - 1; i >= 0; i--) {
                targetEl = selectedProducts.length === i ? this.$el.find('#shippingRow') : $(selectedProducts[i]);
                productId = targetEl.find('.productsDd').attr('data-id');

                if (!productId && !shippingAccount) {
                    return App.render({
                        type   : 'error',
                        message: "产品不可为空！"
                    });
                }

                if (shippingId && !shippingAccount) {
                    return App.render({
                        type   : 'error',
                        message: "运费账户不可为空！"
                    });
                }

                quantity = targetEl.find('[data-name="quantity"] input').val() || targetEl.find('[data-name="quantity"] span').text();
                price = helpers.spaceReplacer(targetEl.find('[data-name="price"] input').val()) * 100;

                if (productId && (isNaN(price) || price <= 0)) {
                    return App.render({
                        type   : 'error',
                        message: '请输入单价！'
                    });
                }
                // scheduledDate = targetEl.find('[data-name="scheduledDate"]').text();
                taxes = helpers.spaceReplacer(targetEl.find('.taxes .sum').text());
                cost = helpers.spaceReplacer(targetEl.find('.cost .sum').text());
                cost = parseFloat(cost) * 100;
                taxes = parseFloat(taxes) * 100;
                description = targetEl.find('textarea.productDescr').val();
                subTotal = helpers.spaceReplacer(targetEl.find('.subtotal .sum').text());
                subTotal = parseFloat(subTotal) * 100;
                jobs = targetEl.find('.current-selected.jobs').attr('data-id');
                account = targetEl.find('.current-selected.accountDd').attr('data-id');
                taxCode = targetEl.find('.current-selected.taxCode').attr('data-id');
                UOM = targetEl.find('[data-name="UOM"] input').val();
                priceQty = targetEl.find('[data-name="priceQty"] input').val() || 0;

                if (productId && !price) {
                    return App.render({
                        type   : 'error',
                        message: '单价不可为空！'
                    });
                }

                if (!quantity) {
                    return App.render({
                        type   : 'error',
                        message: '数量不可为空！'
                    });
                }

                if (jobs === 'jobs' && this.forSales) {
                    return App.render({
                        type   : 'error',
                        message: "Job field can't be empty. Please, choose or create one."
                    });
                }

                products.push({
                    product      : productId,
                    unitPrice    : price,
                    costPrice    : cost,
                    warehouse    : warehouse,
                    quantity     : quantity,
                    UOM          : UOM,
                    debitAccount : account,
                    creditAccount: creditAccount,
                    taxCode      : taxCode || null,
                    taxes        : [{
                        taxCode: taxCode || null,
                        tax    : taxes
                    }],

                    description: description,
                    subTotal   : subTotal,
                    totalTaxes : taxes,
                    priceQty   : priceQty
                });

            }

            if (products.length) {
                status.fulfillStatus = 'NOT';
            }

            data = {
                currency        : currency,
                forSales        : forSales,
                supplier        : supplier,
                deliverTo       : deliverTo,
                priceList       : priceList,
                salesPerson     : assignedTo,
                warehouse       : warehouse,
                products        : products,
                paymentMethod   : paymentMethod,
                orderDate       : helpers.setTimeToDate(orderDate),
                expectedDate    : expectedDate,
                destination     : destination,
                paymentTerm     : paymentTerm,
                fiscalPosition  : fiscalPosition,
                shippingMethod  : shippingId,
                project         : project,
                shippingExpenses: {
                    account: shippingAccount,
                    amount : shippingAmount
                },

                populate   : true, // Need Populate data from server
                paymentInfo: {
                    total   : total,
                    unTaxed : unTaxed + shippingAmount,
                    taxes   : totalTaxes,
                    discount: discount
                },

                status: status,
                groups: {
                    owner: this.$el.find('#allUsersSelect').attr('data-id') || null,
                    users: usersId,
                    group: groupsId
                },

                whoCanRW: whoCanRW,
                workflow: workflow,
                orderType: 'purchaseOrder',
                externalId: building
            };

            if (supplier) {
                this.model.save(data, {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        self.redirectAfterSave(self, model);
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });

            } else {
                return App.render({
                    type   : 'error',
                    message: CONSTANTS.RESPONSES.CREATE_QUOTATION
                });
            }
        },

        redirectAfterSave: function () {
            Backbone.history.fragment = '';
            Backbone.history.navigate(window.location.hash, {trigger: true});
        },

        createProductView: function () {
            var productItemContainer;

            productItemContainer = this.$el.find('#productItemsHolder');

            productItemContainer.append(
                new ProductItemView({
                    canBePurchase   : true,
                    canBeSold       : false,
                    quotations      : true,
                    availableVisible: true,
                    currencySymbol  : this.currencySymbol,
                    responseObj     : this.responseObj,
                    discountVisible : true
                }).render().el
            );

        },

        render: function () {
            var formString = this.template({visible: this.visible, forSales: this.forSales});
            var self = this;
            var curDate = new Date();

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'edit-dialog',
                title      : '新建采购订单',
                width      : '1100px',
                buttons    : [{
                    id   : 'create-person-dialog',
                    text : '创建',
                    class: 'btn blue',

                    click: function () {
                        self.saveItem();
                    }
                }, {
                    text : '取消',
                    class: 'btn',

                    click: function () {
                        self.hideDialog();
                    }
                }]

            });

            this.renderAssignees(this.model);

            populate.get('#destination', '/destination', {}, 'name', this, true, true);
            populate.get('#incoterm', '/incoterm', {}, 'name', this, true, true);
            populate.get('#invoicingControl', '/invoicingControl', {}, 'name', this, true, true);
            populate.get('#paymentTerm', '/paymentTerm', {}, 'name', this, true, true);
            populate.get('#deliveryDd', '/deliverTo', {}, 'name', this, true);
            populate.get2name('#customerDd', CONSTANTS.URLS.CUSTOMERS, {isSupplier: true}, this, true);
            populate.get('#priceList', 'priceList/getForDd', {cost: true}, 'name', this, true);
            populate.get('#currencyDd', CONSTANTS.URLS.CURRENCY_FORDD, {}, 'name', this, true);
            populate.get('#account', '/chartOfAccount/getForDd', {}, 'name', this, true, true);
            populate.get('#warehouseDd', 'warehouse/getForDd', {}, 'name', this, true);
            populate.get('#taxCode', '/taxSettings/getForDd', {}, 'name', this, true, true);
            populate.get('#paymentMethod', '/paymentMethod', {}, 'name', this, false, true, null);
            populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, true);

            self.createProductView();

            dataService.getData('/employees/getForDD', {isEmployee: true}, function (employees) {
                employees = _.map(employees.data, function (employee) {
                    employee.name = employee.name.first + ' ' + employee.name.last;

                    return employee;
                });

                self.responseObj['#assignedTo'] = employees;
            });

            populate.getWorkflow('#workflowsDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {
                id    : 'Purchase Order',
                status: {$ne: 'Done'}
            }, 'name', this, true);

            this.$el.find('#orderDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : '+0D',
                onSelect   : function (date) {
                    self.$el.find('#expectDate').datepicker('option', 'minDate', new Date(date));
                }
            }).datepicker('setDate', curDate);

            this.$el.find('#expectDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                minDate    : new Date()
            });

            this.delegateEvents(this.events);
            return this;
        }

    });

    return CreateView;
});
