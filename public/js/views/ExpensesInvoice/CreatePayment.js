/**
 * Created by admin on 2017/6/24.
 */
define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/ExpensesInvoice/CreatePayTemplate.html',
    'common',
    'populate',
    'views/Assignees/AssigneesView',
    'dataService',
    'constants',
    'helpers',
    'text!templates/ExpensesInvoice/invoiceList.html',
    'models/PaymentModel'
], function ($, _, Backbone, ParentView, CreateTemplate, common, populate,AssigneesView, dataService, CONSTANTS, helpers,invoiceLists,PaymentModel) {
    'use strict';



    var CreateView = ParentView.extend({
        template   : _.template(CreateTemplate),

        initialize: function () {
            this.responseObj = {};
            this.render();
        },

        chooseOption: function (e) {
            var self = this;
            var thisEl = this.$el;
            var $target = $(e.target);
            var holder = $target.parents('dd').find('.current-selected');

            var projectId= $(e.target).attr('id');
            var invoice;
            if ($target.closest('a').attr('id') === 'projectDd') {
                dataService.getData(CONSTANTS.URLS.PROJECTS_GET_FOR_INVOICE,{
                    _id:projectId
                },function (response) {
                    console.log(response)
                    invoice = thisEl.find('#invoiceList');
                    invoice.prepend(_.template(invoiceLists, {
                        invoice:response.invoice
                    }));


                })
            }

            holder.text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
            $(e.target).closest('td').removeClass('errorContent');

        },

        saveItem: function () {
            var self = this;
            var mid = 97;
            var data;
            var $currentEl = this.$el;
            var selectedProducts = $currentEl.find('.invoiceItem');
            var selectedLength = selectedProducts.length;
            var targetEl;

            var differenceAmount;
            var model=new PaymentModel();


            if (selectedLength) {
                var paymentMethod = $currentEl.find('#paymentMethod');
                var paymentMethodID = paymentMethod.attr('data-id');
                var date = $currentEl.find('#paymentDate').val();
                var journal = $currentEl.find('#journal').attr('data-id');
                var currency = {
                    _id : "565eab29aeb95fa9c0f9df2d",
                    name: 'USD'
                };
                for (var i = selectedLength - 1; i >= 0; i--) {
                    targetEl = $(selectedProducts[i]);
                    var choice= targetEl.find(".checkbox").is(':checked');
                    if(choice){
                        var ID= targetEl.find(".checkbox").attr('value');
                        var cash= targetEl.find('#cash').val();
                        var accept=targetEl.find('#accept').val();
                        var total=targetEl.find('#unPay').val();
                        var paymentRef=targetEl.find('#paymentRef').val();
                        var paidAmount=cash*1+accept*1;
                        differenceAmount=total-paidAmount;
                        var paymentWay=[];
                        var payment={};
                        if(cash){
                            payment={
                                way:'现金',
                                amount:cash
                            };
                            paymentWay.push(payment);
                        }
                        if(accept){
                            payment={
                                way:'承兑',
                                amount:accept
                            };
                            paymentWay.push(payment);
                        }
                        data = {
                            mid             : 97,
                            forSale         : false,
                            invoice         : ID,
                            supplier        : null,
                            paymentMethod   : paymentMethodID,
                            date            : helpers.setTimeToDate(date),
                            paidAmount      : paidAmount,
                            paymentWay      :paymentWay,
                            period          : null,
                            paymentRef      : paymentRef,
                            currency        : currency,
                            differenceAmount: differenceAmount,
                            journal         : journal
                        };
                        model.save(data, {
                            headers: {
                                mid: 56
                            },
                            wait   : true,
                            success: function () {

                            },

                            error: function (model, xhr) {
                                self.errorNotification(xhr);
                            }
                        });

                    }
                }
                var redirectUrl = '#easyErp/ExpensesPayments/list';
                Backbone.history.navigate(redirectUrl, {trigger: true})
            }
        },

        render: function () {
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create Invoice',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-invoice-dialog',
                        class: 'btn blue',
                        text : '申请',
                        click: function () {
                            self.saveItem();
                        }
                    }, {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }]
            });
            populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, false, false);
            populate.get('#paymentMethod', '/paymentMethod', {}, 'name', this, true, true);

            populate.get('#journal', '/journals/getForDd', {}, 'name', this, true, true);
            this.$el.find('#paymentDate').datepicker({
                dateFormat : 'd M, yy',
                changeMonth: true,
                changeYear : true,
                maxDate    : 0
            }).datepicker('setDate', new Date())

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});

