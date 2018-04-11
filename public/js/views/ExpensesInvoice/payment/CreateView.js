define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/ExpensesInvoice/Payment/CreateTemplate.html',
    'collections/Persons/PersonsCollection',
    'collections/Departments/DepartmentsCollection',
    'collections/salesInvoices/filterCollection',
    'collections/customerPayments/filterCollection',
    'views/Projects/projectInfo/payments/paymentView',
    'models/PaymentModel',
    'common',
    'populate',
    'dataService',
    'constants',
    'helpers/keyValidator',
    'helpers'], function (Backbone,
                          $,
                          _,
                          Parent,
                          CreateTemplate,
                          PersonCollection,
                          DepartmentCollection,
                          invoiceCollection,
                          paymentCollection,
                          PaymentView,
                          PaymentModel,
                          common,
                          populate,
                          dataService,
                          CONSTANTS,
                          keyValidator,
                          helpers) {
    var CreateView = Parent.extend({
        el         : '#paymentHolder',
        contentType: 'Payment',
        template   : _.template(CreateTemplate),

        initialize: function (options) {

            this.eventChannel = options.eventChannel;

            if (options) {
                this.invoiceModel = options.model;
                this.totalAmount = this.invoiceModel.get('paymentInfo').balance || 0;
                this.forSales = this.invoiceModel.get('forSales');
                this.mid = options.mid || 56;
            } else {
                this.forSales = true;
            }
            this.responseObj = {};
            this.model = new PaymentModel();
            this.differenceAmount = 0;

            this.redirect = options.redirect;
            this.collection = options.collection;

            this.currency = options.currency || {};
            this.changePaidAmount = _.debounce(this.changePaidAmount, 500);

            this.render();
        },

        events: {
            'keypress:not(#selectInput)': 'keypressHandler',
            'keyup #paidAmount'         : 'changePaidAmount'
        },

        changePaidAmount: function (e) {
            var self = this;
            var targetEl = $('#paidAmount');
            var changedValue = $.trim(targetEl.val());
            var currency = $.trim(this.$el.find('#currencyDd').text());
            var differenceAmountContainer = this.$el.find('#differenceAmountContainer');
            var differenceAmount = differenceAmountContainer.find('#differenceAmount');
            var totalAmount = parseFloat(this.totalAmount);
            var date = $('#paymentDate').val();
            var data = {};

            changedValue = parseFloat(helpers.spaceReplacer(changedValue));

            data.totalAmount = totalAmount;
            data.paymentAmount = changedValue;
            data.invoiceCurrency = this.currency.name;
            data.paymentCurrency = currency;
            data.date = date;

            dataService.getData(CONSTANTS.URLS.PAYMENT_AMOUNT_LEFT, data,
                function (res, self) {
                    if (res.difference) {
                        differenceAmount.text(res.difference.toFixed(2));
                        self.differenceAmount = res.difference;

                        return differenceAmountContainer.removeClass('hidden');
                    }

                    if (!differenceAmountContainer.hasClass('hidden')) {
                        return differenceAmountContainer.addClass('hidden');
                    }
                }, self);

            App.stopPreload();
        },

        chooseOption: function (e) {
            var self = this;
            var target = $(e.target);
            var targetElement = target.closest('a');
            var attr = targetElement.attr('id');
            var newCurrency = target.attr('id');
            var newCurrencyClass = helpers.currencyClass(newCurrency);
            var paymentMethods;
            var el;
            var accountName = this.forSales ? 'debitAccount' : 'creditAccount';
            var query = {
                transaction: 'Payment'
            };

            var array = this.$el.find('#paidAmountDd');
            array.attr('class', newCurrencyClass);

            if (attr === 'paymentMethod') {

                paymentMethods = self.responseObj['#paymentMethod'];

                el = _.find(paymentMethods, function (item) {
                    return item._id === newCurrency;
                });

                if (el && el.chartAccount && el.chartAccount._id) {

                    query[accountName] = el.chartAccount._id;

                    dataService.getData('/journals/getByAccount', query, function (resp) {
                        // self.responseObj['#journal'] = resp.data || [];

                        if (resp.data && resp.data.length) {
                            (self.$el.find('#journal').text(resp.data[0].name)).attr('data-id', resp.data[0]._id);
                        } else {
                            (self.$el.find('#journal').text('Select')).attr('data-id', null);
                            self.$el.find('#journal').addClass('errorContent');
                        }

                    });
                } else {
                    (self.$el.find('#journal').text('Select')).attr('data-id', null);
                }

                $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));

                this.changePaidAmount();
            } else {
                $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));

                this.changePaidAmount();
            }
        },

        keypressHandler: function (e) {
            return keyValidator(e, true);
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
        },

        saveItem: function () {

            var self = this;
            var data;
            // FixMe change mid value to proper number after inserting it into DB
            var mid = self.mid || 56;
            var thisEl = this.$el;
            var paymentWay=[];
            var payment={};

            var invoiceModel = this.invoiceModel.toJSON();
            var supplier = thisEl.find('#supplierDd');
            var supplierId = supplier.attr('data-id');
            var cash = thisEl.find('#cash').val()*1;
            var accept = thisEl.find('#accept').val()*1;
            var paidAmount = cash*1+accept*1;
            var paymentMethod = thisEl.find('#paymentMethod');
            var paymentMethodID = paymentMethod.attr('data-id');
            var date = thisEl.find('#paymentDate').val();
            var paymentRef = thisEl.find('#paymentRef').val();
            var period = thisEl.find('#period').attr('data-id');
            var journal = thisEl.find('#journal').attr('data-id');
            var currency = {
                _id : thisEl.find('#currencyDd').attr('data-id'),
                name: $.trim(thisEl.find('#currencyDd').text())
            };
            console.log(accept)
            if(cash){
                payment={
                    way:'现金',
                    amount:cash
                };
                paymentWay.push(payment);
            }
            if(cash){
                payment={
                    way:'承兑',
                    amount:accept
                };
                paymentWay.push(payment);
            }


            paidAmount = parseFloat(paidAmount);
            if (isNaN(paidAmount) || paidAmount <= 0) {
                return App.render({
                    type   : 'error',
                    message: '请输入支付金额!'
                });
            }

            if (!paymentMethodID) {
                return App.render({
                    type   : 'error',
                    message: "银行账户不能为空."
                });
            }

            if (!journal) {
                return App.render({
                    type   : 'error',
                    message: "凭证不能为空."
                });
            }

            data = {
                mid             : mid,
                forSale         : this.forSales,
                invoice         : invoiceModel._id,
                supplier        : null,
                paymentMethod   : paymentMethodID,
                date            : helpers.setTimeToDate(date),
                period          : period,
                paymentRef      : paymentRef,
                paidAmount      : paidAmount,
                paymentWay:paymentWay,
                currency        : currency,
                differenceAmount: this.differenceAmount,
                journal         : journal
            };

            if (supplier) {
                this.model.save(data, {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function () {
                        var redirectUrl;

                        if (mid === 97) {
                            redirectUrl = '#easyErp/ExpensesPayments/list';
                        } else if (mid === 100) {
                            redirectUrl = '#easyErp/DividendPayments/list';
                        } else if (mid === 109) {
                            redirectUrl = '#easyErp/purchasePayments/list';
                        } else if (mid === 95) {
                            redirectUrl = '#easyErp/purchasePayments/list';
                        } else {
                            redirectUrl = self.forSales ? 'easyErp/customerPayments' : 'easyErp/supplierPayments';
                        }

                        self.hideDialog();

                        if (self.redirect) {
                            if (self.eventChannel) {
                                self.eventChannel.trigger('newPayment');
                            }
                        } else {
                            Backbone.history.navigate(redirectUrl, {trigger: true});
                        }
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });

            } else {
                App.render({
                    type   : 'error',
                    message: CONSTANTS.RESPONSES.CREATE_QUOTATION
                });
            }
            console.log(data)
        },

        render: function () {
            var self = this;
            var model = this.invoiceModel.toJSON();
            var account = model.project && model.project.paymentMethod || model.paymentMethod;
            var htmBody = this.template({
                invoice      : model,
                currency     : self.currency,
                currencyClass: helpers.currencyClass
            });

            this.$el = $(htmBody).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create Payment',
                buttons      : [
                    {
                        id   : 'create-payment-dialog',
                        class: 'btn blue',
                        text : '创建',
                        click: function () {
                            self.saveItem();
                        }
                    },
                    {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }
                ]
            });

            populate.get2name('#supplierDd', CONSTANTS.URLS.SUPPLIER, {}, this, false, true);
            populate.get('#period', '/period', {}, 'name', this, true, true);

            if (!model.paymentMethod && model.project && model.project.paymentMethod) {
                populate.get('#paymentMethod', '/paymentMethod', {}, 'name', this, true, true, model.project.paymentMethod);
            } else {
                populate.get('#paymentMethod', '/paymentMethod', {}, 'name', this, true, true, model.paymentMethod, null, this.$el);
            }

            populate.get('#currencyDd', '/currency/getForDd', {}, 'name', this, true);
            populate.get('#journal', '/journals/getForDd', {}, 'name', this, true, true);

            this.$el.find('#paymentDate').datepicker({
                dateFormat : 'd M, yy',
                changeMonth: true,
                changeYear : true,
                maxDate    : 0,
                onSelect   : function () {
                    self.changePaidAmount();
                }
            }).datepicker('setDate', new Date())
                .datepicker('option', 'minDate', model.invoiceDate);

            this.delegateEvents(this.events);
            return this;
        }
    });

    return CreateView;
});
