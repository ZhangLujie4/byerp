define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/ExpensesInvoice/CreateTemplate.html',
    'views/Notes/AttachView',
    'models/InvoiceModel',
    'common',
    'populate',
    'views/ExpensesInvoice/InvoiceProductItems',
    'views/Assignees/AssigneesView',
    'views/Payment/list/ListHeaderInvoice',
    'dataService',
    'constants',
    'helpers'
], function ($, _, Backbone, ParentView, CreateTemplate, attachView, InvoiceModel, common, populate, ProductItemView, AssigneesView, ListHeaderInvoice, dataService, CONSTANTS, helpers) {
    'use strict';



    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'Invoices',
        template   : _.template(CreateTemplate),

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new InvoiceModel();
            this.responseObj = {};
            this.amount=0;
            this.total=0;

            this.render();
        },

        events: {
            'click .details': 'showDetailsBox'
        },


        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('dd').find('.current-selected');

            var total=0;
            var amount;
            var preAmount;


            var projectId= $(e.target).attr('id');

            if ($target.closest('a').attr('id') === 'projectDd') {

                dataService.getData( CONSTANTS.URLS.PROJECTS_GET_FOR_INVOICE, {
                    _id: projectId
                }, function (response, context) {
                    var project = response;
                    var pmr;
                    pmr=project.project[0].pmr;
                    amount=project.project[0].amount;
                    preAmount=project.project[0].preAmount;
                    for(var i=0;i<project.invoice.length;i++){
                        total=total+project.invoice[i].paymentInfo.total/100;
                        if(project.invoice[i].invoiceType){
                            preAmount=preAmount-project.invoice[i].paymentInfo.total/100;
                        }
                    }
                    context.$el.find('#projectAmount').val(amount);
                    amount=amount-total;
                    context.$el.find('#amount').val(amount);
                    context.$el.find('#preAmount').val(preAmount);
                    if(amount<0){
                        return App.render({
                            type   : 'error',
                            message: '超出可报销金额!'
                        })
                    }
                    dataService.getData(CONSTANTS.URLS.PROJECTFUND_GETFORPROJECT,{
                        employee:pmr},function (res) {
                        var result=res.projetFund;
                        var projectNumber=result.length;
                        var projectAmount=0;
                        var expense=0;
                        var hongzi;
                        for(var i=0;i<projectNumber;i++){
                            projectAmount=projectAmount+result[i].amount*1;
                            if(result[i].payment.length>0){
                                for(var a=0;a<result[i].payment.length;a++){
                                    expense=expense+result[i].payment[a].paymentInfo.total*1/100;
                                }
                            }
                        }
                        hongzi=projectAmount-expense;
                        context.$el.find('#total').val(hongzi);
                        if(hongzi<0){
                            return App.render({
                                type   : 'error',
                                message: '超出可报销金额!'
                            })
                        }
                    })
                }, this);
            }

            holder.text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
            $(e.target).closest('td').removeClass('errorContent');

        },

        showDetailsBox: function (e) {
            $(e.target).parent().find('.details-box').toggle();
        },

        saveItem: function () {
            var self = this;
            var mid = 97;
            var $currentEl = this.$el;
            var errors = $currentEl.find('.errorContent');
            var selectedProducts = $currentEl.find('.productItem');
            var products = [];
            var selectedLength = selectedProducts.length;
            var targetEl;

            var price;

            var whoCanRW;
            var data;
            var model;

            var groupsId;
            var usersId;
            var description;
            var i;
            var total=0;

            var invoiceDate = $currentEl.find('#invoice_date').val();
            var invoiceId = $currentEl.find('#invoiceId').val();
            var invoiceMan= $currentEl.find('#invoiceMan').val();
            var invoiceMold= $currentEl.find("[name='invoiceMold']:checked").attr('data-value');
            var invoiceType= $currentEl.find("[name='invoiceType']:checked").attr('data-value');
            console.log(invoiceType)
            var buyerName= $currentEl.find('#buyerName').val();
            var buyerId= $currentEl.find('#buyerId').val();
            var buyerPhone= $currentEl.find('#buyerPhone').val();
            var buyerAddress= $currentEl.find('#buyerAddress').val();
            var buyerBank= $currentEl.find('#buyerBank').val();
            var buyerBankNumber= $currentEl.find('#buyerBankNumber').val();
            var saleName= $currentEl.find('#saleName').val();
            var saleId= $currentEl.find('#saleId').val();
            var salePhone= $currentEl.find('#salePhone').val();
            var saleAddress= $currentEl.find('#saleAddress').val();
            var saleBank= $currentEl.find('#saleBank').val();
            var saleBankNumber= $currentEl.find('#saleBankNumber').val();
            var projectId= $currentEl.find('#projectDd').data('id');
            var totalAmountSmall=$currentEl.find('#totalAmountSmall').text();
            var totalAmountBig=$currentEl.find('#totalAmountBig').text();
            var projectAmount= $currentEl.find('#amount').val();
            var projectTotal= $currentEl.find('#projectAmount').val();




            if (errors.length) {
                return false;
            }

            if (selectedLength) {
                for (i = selectedLength - 1; i >= 0; i--) {
                    targetEl = $(selectedProducts[i]);
                    var name = targetEl.find('#name').val();
                    var modelNumber = targetEl.find('#modelNumber').val();
                    var unite = targetEl.find('#unite').val();
                    var taxes = targetEl.find('[data-name="taxes"] input').val()*100;
                    var amount = targetEl.find('.amount').text();
                    var quantity = targetEl.find('[data-name="quantity"] input').val();
                    var unitPrice = targetEl.find('[data-name="price"] input').val()*100;
                    var taxesAmount = targetEl.find('.taxesAmount').text();
                    taxesAmount = parseFloat(taxesAmount) * 100;
                    amount = parseFloat(amount) * 100;
                    total=total+amount;
                    products.push({
                        name       : name,
                        quantity          : quantity,
                        unitPrice         :unitPrice,
                        modelNumber:modelNumber,
                        unite:unite,
                        taxes:taxes,
                        taxesTotal:taxesAmount,
                        subTotal:amount
                    });
                }
            }

            var payments = {
                total  : totalAmountSmall*100,
                unTaxed: total,
                balance: totalAmountSmall*100
            };
            if(invoiceType=="false"){
                switch(invoiceMold){
                    case '材料采购':
                        if(projectAmount-totalAmountSmall*1<projectTotal*0.05){
                            return App.render({
                                type   : 'error',
                                message: '超出可报销金额!'
                            });}
                            break;
                        case '外加工':if(projectAmount-totalAmountSmall*1<projectTotal*0.05){
                            return App.render({
                                type   : 'error',
                                message: '超出可报销金额!'
                            });};break;
                        case '委外承包': if(projectAmount-totalAmountSmall*1<projectTotal*0.05){
                            return App.render({
                                type   : 'error',
                                message: '超出可报销金额!'
                            });};break;
                        case '其他': if(projectAmount-totalAmountSmall*1<projectTotal*0.05){
                            return App.render({
                                type   : 'error',
                                message: '超出可报销金额!'
                            });};break;
                        case '清工费': if(projectAmount-totalAmountSmall*1<projectTotal*0.05){
                            return App.render({
                                type   : 'error',
                                message: '超出可报销金额!'
                            });};break;
                        case '保证金，暂扣税金，现金，检测模具': if(projectAmount-totalAmountSmall*1<projectTotal*0.05){
                            return App.render({
                                type   : 'error',
                                message: '超出可报销金额!'
                            });};break;
                }
            }else{
                console.log(2)
            }
            /* usersId = [];
            groupsId = [];
            $('.groupsAndUser tr').each(function () {
                if ($(this).data('type') === 'targetUsers') {
                    usersId.push($(this).data('id'));
                }
                if ($(this).data('type') === 'targetGroups') {
                    groupsId.push($(this).data('id'));
                }

            });

            whoCanRW = this.$el.find("[name='whoCanRW']:checked").val();*/
            var currency = {
                _id : "565eab29aeb95fa9c0f9df2d",
                name: 1
            };
            data = {
                forSales             : false,
                invoiceId            :invoiceId,
                invoiceMan           :invoiceMan,
                invoiceDate          :invoiceDate,
                invoiceMold          :invoiceMold,
                invoiceType          :invoiceType,
                buyerName            :buyerName,
                buyerId              :buyerId,
                buyerPhone           :buyerPhone,
                buyerAddress         :buyerAddress,
                buyerBank            :buyerBank,
                buyerBankNumber      :buyerBankNumber,
                saleName             :saleName,
                saleId               :saleId,
                salePhone            :salePhone,
                saleAddress          :saleAddress,
                saleBank             :saleBank,
                saleBankNumber       :saleBankNumber,
                projectId            :projectId,
                totalAmountBig       :totalAmountBig,
                totalAmountSmall     :totalAmountSmall,
                products             : products,
                paymentInfo          : payments,
                workflow             : this.defaultWorkflow,


                supplier             : "5735b242e9b0919847c1fad6",
                supplierInvoiceNumber:invoiceDate ,

                dueDate              : invoiceDate,
                journal              : null,
                currency             : currency,
                groups               : {
                    owner: this.$el.find('#allUsersSelect').attr('data-id') || null,
                    users: [],
                    group: []
                },

                whoCanRW: "everyOne"
            };

            if (1) {
                model = new InvoiceModel();
                model.urlRoot = function () {
                    return 'expensesInvoice';
                };

                model.save(data, {
                    patch  : true,
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function () {
                        self.hideDialog();
                        Backbone.history.navigate('#easyErp/ExpensesInvoice', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });

            } else {
                App.render({
                    type   : 'error',
                    message: 'Please fill all fields.'
                });
            }

        },

        createProductView: function () {
            var productItemContainer;

            productItemContainer = this.$el.find('#invoiceItemsHolder');

            productItemContainer.append(
                new ProductItemView({canBeSold: false}).render().el
            );

        },

        render: function () {
            var formString = this.template();
            var self = this;
            var invoiceItemContainer;
            var paymentContainer;
            var notDiv;
            var today = new Date();

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
                        text : 'Create',
                        click: function () {
                            self.saveItem();
                        }
                    }, {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }]
            });

            this.renderAssignees(this.model);
            this.createProductView();

            /*  invoiceItemContainer = this.$el.find('#invoiceItemsHolder');
             invoiceItemContainer.append(
             new InvoiceItemView({balanceVisible: true, canBeSold: this.forSales}).render().el
             );*/

            paymentContainer = this.$el.find('#payments-container');
            paymentContainer.append(
                new ListHeaderInvoice().render().el
            );

            populate.get('#currencyDd', '/currency/getForDd', {}, 'name', this, true);
            populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, false, false);
            populate.get2name('#supplier', '/supplier', {}, this, false, true);
            populate.get('#payment_terms', '/paymentTerm', {}, 'name', this, true, true);
            populate.get2name('#salesPerson', CONSTANTS.EMPLOYEES_RELATEDUSER, {}, this, true, true);
            populate.fetchWorkflow({wId: 'Purchase Invoice'}, function (response) {
                if (!response.error) {
                    self.defaultWorkflow = response._id;
                }
            });

            this.$el.find('#invoice_date').datepicker({
                dateFormat : 'd M, yy',
                changeMonth: true,
                changeYear : true
            }).datepicker('setDate', today);

            today.setDate(today.getDate() + 14);

            this.$el.find('#due_date').datepicker({
                dateFormat : 'd M, yy',
                changeMonth: true,
                changeYear : true,
                onSelect   : function () {
                    var targetInput = $(this);
                    targetInput.removeClass('errorContent');
                }
            }).datepicker('setDate', today);

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
