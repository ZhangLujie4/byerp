define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/goodsInNotes/form/FormTemplate.html',
    'text!templates/goodsInNotes/temps/documentTemp.html',
    'views/dialogViewBase',
    'views/Assignees/AssigneesView',
    'views/Products/InvoiceOrder/ProductItems',
    'views/goodsInNotes/PackNote',
    'views/NoteEditor/NoteView',
    'views/Editor/AttachView',
    'views/goodsInNotes/EmailView',
    'common',
    'custom',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'helpers/exportToPdf',
    'moment'
], function (Backbone,
             $,
             _,
             EditTemplate,
             DocumentTemplate,
             BaseView,
             AssigneesView,
             ProductItemView,
             PackNote,
             NoteEditor,
             AttachView,
             EmailView,
             common,
             Custom,
             dataService,
             populate,
             CONSTANTS,
             helpers,
             exportToPdf,
             moment) {
    'use strict';

    var FormView = BaseView.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.QUOTATIONS,
        imageSrc   : '',
        template   : _.template(EditTemplate),
        templateDoc: _.template(DocumentTemplate),
        responseObj: {},

        initialize: function (options) {
            if (options) {
                this.visible = options.visible;
                this.eventChannel = options.eventChannel;
            }

            _.bindAll(this, 'render', 'deleteItem');

            if (options.model) {
                this.currentModel = options.model;
            } else {
                this.currentModel = options.collection.getElement();
            }

            this.currentModel.urlRoot = '/goodsInNotes';

            this.currentModel.on('sync', this.render, this);
            this.responseObj = {};

        },

        events: {
            'click #printPdf:not(.done)': 'printPdf',
            'click #packBtn:not(.done)' : 'packNote',
            'click .sendEmail'          : 'sendEmail',
            'click #attachment_file'    : 'clickInput',
            'click .setDraft'           : 'setDraft',
            'click .saveBtn'            : 'saveQuotation',
            'click .changeStatus'       : 'changeStatus',
            'click .checkStatus'        : 'checkStatus',
            'click .goodsInNew'         : 'goodsInNew',
            'keyup td[data-name=taxesAccount] input'           : 'taxesChange',
            'keyup td[data-name=quantity],td[data-name=unit],td[data-name=unitPrice] input'           : 'priceChange',
            'click .weightAdjust'       : 'weightAdjust',
            'click .cancel'             : 'goodsNoteCancel',
            'click .goodsNoteEdit'      : 'goodsNoteEdit',
            'click .editNote'           : 'showEdit',
            'click .editCancel'         : 'editCancel'
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var id = $target.attr('id');
            var $parent = $target.closest('tr');
            var type = $target.closest('a').attr('id');

            if (type === 'taxCodeLine') {
                var taxCode = _.findWhere(this.responseObj['#taxCode'], {_id: $target.attr('id')});

                if (taxCode && taxCode._id) {
                    $target.parents('td').find('.current-selected').attr('data-tax', taxCode.rate);
                }

                this.taxesChange(e);
            }

            $target.closest('.current-selected').text($target.text()).attr('data-id', id);

            this.hideNewSelect();

            return false;
        },

        printPdf: function (e) {
            e.preventDefault();
            window.print();
        },

        packNote: function (e) {
            var date = this.$el.find('#date').text() || this.$el.find('#date').val();

            e.preventDefault();

            new PackNote({model: this.currentModel, date: date});
        },

        sendEmail: function (e) {
            var self = this;
            var template = this.$el.find('#templateDiv').html();

            e.preventDefault();

            self.hideDialog();

            exportToPdf.takeToInput({file: template, name: this.model.get('name')}, function (data) {
                return new EmailView({
                    model     : self.currentModel,
                    attachment: data
                });
            });

        },

        changeStatus: function (e) {
            var $target = $(e.target);
            var self = this;
            var status = $target.attr('data-id');
            var modelStatus = this.currentModel.get('status');
            var modelJSON = this.currentModel.toJSON();
            var date = this.$el.find('#date').text() || this.$el.find('#date').val();
            var done = $target.hasClass('done');
            var saveObject = {};
            var allStatus = ['printed', 'picked', 'packed'];

            saveObject.date = helpers.setTimeToDate(date);

            saveObject['status.' + status] = true;

            e.preventDefault();

            if (done) {
                saveObject['status.' + status] = false;
            }

            if (status === 'shipped') {

                if (modelJSON.order.shippingExpenses && modelJSON.order.shippingExpenses.amount && !modelJSON.shippingMethod) {
                    return App.render({
                        type   : 'error',
                        message: 'Shipping Method can\'t be empty. Please, first Pack items.'
                    });
                }
                allStatus.forEach(function (el) {
                    if (!modelStatus[el]) {
                        saveObject['status.' + el] = true;
                    }
                });

                this.$el.find('.list').find('[data-id="' + status + '"] a').addClass('done');
            }

            this.currentModel.save(saveObject, {patch: true});
        },

        redirectAfter: function (content) {
            Backbone.history.fragment = '';
            Backbone.history.navigate(window.location.hash, {trigger: true});
        },

        checkStatus: function(e){
            var self = this;
            var model = this.currentModel.toJSON();
            var answer;
            var id;
            var isValid = self.$('#isValid').is(':checked');
            e.preventDefault();
            id = model._id;
            var invoiceName = '';
            if(isValid){
                invoiceName = self.$el.find('.invoice').val();
                if(invoiceName == 0){
                    return App.render({
                        type   : 'error',
                        message: '发票号码未填写!'
                    })
                }
            }
            var status = model.status;
            var selectedProducts = self.$el.find('.productItem');
            var selectedLength = selectedProducts.length;
            var targetEl;
            var products = [];
            var selectedParameters;
            var i;
            var j;
            var ttEl;
            var paraname;
            var value;
            if(isValid){
                answer = confirm('入库单已收到发票，发票号码为'+ invoiceName +'，确认是否要进行正式入库操作？');
            } else{
                answer = confirm('入库单未收到发票，确认是否要进行预入库审核操作？');
            }
            for (i = 0; i < selectedLength; i++) {
                targetEl = $(selectedProducts[i]);
                var unitPrice = parseFloat(targetEl.find('.price').val()) || 0;
                var unit = parseFloat(targetEl.find('.unit').val()) || 0;
                var orderRowId = model.orderRows[i]._id;
                var locationsReceived = model.orderRows[i].locationsReceived;
                var product = model.orderRows[i].product._id;
                var cost = unitPrice*100;
                var quantity = parseFloat(targetEl.find('.quantity').val()) || 0;
                var UOM = model.orderRows[i].UOM;
                var parameters = [];
                var taxCode = targetEl.find('.current-selected.taxCode').attr('data-id');
                var taxesAccount = parseFloat(targetEl.find('.taxesAccount').val()) || 0;

                selectedParameters = targetEl.find('.'+orderRowId+'_parameterItem');

                for(j = selectedParameters.length-1; j>=0; j-- ){
                    ttEl = $(selectedParameters[j]);
                    paraname = ttEl.find('.paraName').text();
                    value = ttEl.find('#newParas').val();
                    parameters.push({
                        paraname : paraname,
                        value : value
                    });
                }

                products.push({
                            orderRowId       : orderRowId,
                            locationsReceived: locationsReceived,
                            product          : product,
                            cost             : cost,
                            quantity         : quantity,
                            UOM              : UOM,
                            unit             : unit,
                            unitPrice        : unitPrice,
                            parameters       : parameters,
                            taxCode          : taxCode,
                            tax              : taxesAccount
                        });
            }

            if( answer ){
                dataService.getData( '/goodsInNotes/confirmIssue', {
                    id        : id,
                    status    : status,
                    orderRows : products,
                    isValid   : isValid,
                    invoiceName   : invoiceName
                },function (response,context) {
                    window.location.hash = '#easyErp/goodsInNotes';
                },this);
            }
        },

        goodsInNew: function(e, content) {
            e.preventDefault();
            e.stopPropagation();
            var self = this;
            var answer;
            var id;
            var i;
            var j;
            var model;
            var saveObject1;   //offical data
            var saveObject2;    //offset data
            var products1 = [];
            var products2 = [];
            var invoiceName;
            var oldmark = '';
            var newmark = '';
            model = this.currentModel.toJSON();
            if(content == 'edit'){
                invoiceName = model.invoiceName;
                oldmark = model.description + '(原正式入库单)';
                answer = confirm('该入库单发票号码为'+ invoiceName +'，请确认是否要进行入库单修改？');
            } else{
                invoiceName = self.$el.find('.invoice').val();
                if(invoiceName == 0){
                    return App.render({
                        type   : 'error',
                        message: '发票号码未填写!'
                    })
                }
                var Premium = parseFloat(self.$el.find('.Premium').val()) || 0;
                oldmark = '(原预入库单)';
                newmark = (Premium > 0) ? '(蓝冲)' : '(红冲)';
                answer = confirm('入库单已经收到发票，发票号码为'+ invoiceName +'，发票差额为'+ Premium +'，请确认是否要正式入库？');
            }
            id = model._id;
            var selectedProducts = self.$el.find('.productItem');
            var selectedLength = selectedProducts.length;
            var targetEl;
            console.log(model);

            
            if( answer ){
                for (i = 0; i < selectedLength; i++) {

                    var locationReceived = [];
                    var locationReceived2 = [];
                    targetEl = $(selectedProducts[i]);
                    var unitPrice = parseFloat(targetEl.find('.price').val()) || 0;
                    var unit = parseFloat(targetEl.find('.unit').val()) || 0;
                    var taxCode = targetEl.find('.current-selected.taxCode').attr('data-id');
                    var taxesAccount = parseFloat(targetEl.find('.taxesAccount').val()) || 0;

                    for(j = model.orderRows[i].locationsReceived.length - 1; j >= 0; j--){
                        locationReceived.push({
                            location: model.orderRows[i].locationsReceived[j].location._id,
                            quantity: model.orderRows[i].locationsReceived[j].quantity
                        });
                        locationReceived2.push({
                            location: model.orderRows[i].locationsReceived[j].location._id,
                            quantity: model.orderRows[i].locationsReceived[j].quantity*(-1)
                        });
                    }
                    products1.push({
                        orderRowId       : model.orderRows[i]._id,
                        locationsReceived: locationReceived,
                        product          : model.orderRows[i].product._id,
                        quantity         : model.orderRows[i].selectedQuantity,
                        unit             : unit,
                        unitPrice        : unitPrice,
                        cost             : model.orderRows[i].cost,
                        UOM              : model.orderRows[i].UOM,
                        parameters       : model.orderRows[i].params,
                        taxCode          : taxCode,
                        tax              : taxesAccount
                    });

                    products2.push({
                        orderRowId       : model.orderRows[i]._id,
                        locationsReceived: locationReceived2,
                        product          : model.orderRows[i].product._id,
                        quantity         : model.orderRows[i].selectedQuantity*(-1),
                        unit             : model.orderRows[i].unit,
                        unitPrice        : model.orderRows[i].unitPrice,
                        cost             : model.orderRows[i].cost,
                        UOM              : model.orderRows[i].UOM,
                        parameters       : model.orderRows[i].params,
                        taxCode          : model.orderRows[i].taxCode._id,
                        tax              : model.orderRows[i].tax
                    });
                }


                saveObject1 = {
                    warehouse     : model.warehouse,
                    order         : model.order._id,
                    name          : model.order.name,
                    date          : model.date,
                    shippingCost  : model.shippingCost,
                    status        : {
                        received: true
                    },
                    orderRows     : products1,
                    isValid       : true,
                    invoiceName   : invoiceName,
                    shippinglist  : model.shippinglist
                };

                saveObject2 = {
                    warehouse     : model.warehouse,
                    order         : model.order._id,
                    name          : model.order.name,
                    date          : model.date,
                    shippingCost  : model.shippingCost,
                    status        : {
                        received: true
                    },
                    orderRows     : products2,
                    isValid       : false,
                    shippinglist  : model.shippinglist
                };

                if(content == 'edit'){
                    dataService.getData( '/goodsInNotes/goodsInNew', {
                        id    : id,
                        body1 : saveObject1,
                        body2 : saveObject2,
                        oldmark : oldmark,
                        newmark : newmark
                    }, function (response,context) {
                            window.location.hash = '#easyErp/goodsInNotes';
                    },this);
                } else{
                    if(Premium<-10 || Premium>10){
                        dataService.getData( '/goodsInNotes/goodsInNew', {
                            id    : id,
                            body1 : saveObject1,
                            body2 : saveObject2,
                            oldmark : oldmark,
                            newmark : newmark
                        }, function (response,context) {
                                window.location.hash = '#easyErp/goodsInNotes';
                        },this);
                    } else{
                        dataService.getData( '/goodsInNotes/goodsInNewspecial', {
                            id    : id,
                            body1 : saveObject1,
                            body2 : saveObject2,
                            oldmark : oldmark,
                            newmark : newmark
                            }, function (response,context) {
                                dataService.getData( '/goodsInNotes/goodsOutCreate', {
                                    id    : id,
                                    Premium: Premium
                                    }, function (response1,context1) {
                                        window.location.hash = '#easyErp/goodsInNotes';
                                        },this);
                                },this);
                    }
                }                    
            }
        },

        taxesChange: function (e) {
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var val;
            var taxes = parseFloat($parent.find('.current-selected.taxCode').attr('data-tax')) || 0;
            var subtotal = $parent.find('[data-name="subtotal"] input').val() || $parent.find('[data-name="subtotal"]').text();
            var taxesAccount = subtotal/(1+taxes)*(taxes);
            taxesAccount = taxesAccount.toFixed(2);
            $parent.find('.taxesAccount').val(taxesAccount);

            var thisEl = this.$el;
            var taxesContainer = thisEl.find('[data-name="subtaxes"]');
            var totalContainer = thisEl.find('[data-name="subcost"]');
            var qtyContainer = thisEl.find('[data-name="subqty"]');
            var resultForCalculate = thisEl.find('tr.productItem');
            var totalUntax = 0;
            var totalEls;
            var $currentEl;
            var quantity;
            var subqty = 0;
            var unit;
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
            totalEls = resultForCalculate.length;
            if (totalEls) {
                for (i = totalEls - 1; i >= 0; i--) {
                    $currentEl = $(resultForCalculate[i]);
                    quantity = parseFloat($currentEl.find('[data-name="quantity"] input').val()) || 0;
                    cost = parseFloat($currentEl.find('[data-name="subtotal"] input').val()) || $currentEl.find('[data-name="subtotal"]').text() || 0;
                    tax = parseFloat($currentEl.find('[data-name="taxesAccount"] input').val()) || 0;
                    subqty += quantity;
                    taxesTotal += tax;
                    totalUntax += cost;
                }
            }
            taxesContainer.text('总税额：'+taxesTotal.toFixed(2));
            totalContainer.text('总计：'+totalUntax.toFixed(2));
            qtyContainer.text('总量：'+subqty);
        },

        priceChange: function (e) {
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var quantity = $parent.find('[data-name="quantity"] input').val() || $parent.find('[data-name="quantity"]').text();
            var unit = $parent.find('[data-name="unit"] input').val() || $parent.find('[data-name="unit"]').text();
            var unitPrice = $parent.find('[data-name="unitPrice"] input').val() || $parent.find('[data-name="unitPrice"]').text();
            var subtotal = quantity*unit*unitPrice;
            subtotal = subtotal.toFixed(2);
            $parent.find('.subtotal').val(subtotal);
            this.taxesChange(e);
        },

        weightAdjust: function(e) {
            e.preventDefault();
            e.stopPropagation();
            var self = this;
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var adjustWeight = parseFloat(self.$el.find('#weightAdjust').val());
            if(!adjustWeight){
                return App.render({
                    type   : 'error',
                    message: '请先输入实际计价数量！'
                });
            }
            var subweight = parseFloat(self.$el.find('[data-name="subweight"] a').text());
            var rate = adjustWeight/subweight;
            var subtaxes = 0;
            var subcost = 0;
            var $products = self.$el.find('tr.productItem');
            $.each($products, function (i,j) {
                var adjustUnit = 0;
                var unit = $(j).find('.unit').val();
                var quantity = $(j).find('.quantity').val();
                var unitPrice = $(j).find('.price').val();
                adjustUnit = unit * rate;
                var subtotal = unitPrice*quantity*adjustUnit;
                var taxes = parseFloat($(j).find('.taxCode').attr('data-tax')) || 0;
                var taxesAccount = subtotal/(1+taxes)*(taxes);
                subtaxes += taxesAccount;
                subcost += subtotal;
                $(j).find('.unit').val(adjustUnit);
                $(j).find('.subtotal').val(subtotal.toFixed(2));
                $(j).find('.taxesAccount').val(taxesAccount.toFixed(2));
            });
            self.$el.find('[data-name="subweight"] a').text(adjustWeight);
            self.$el.find('[data-name="subtaxes"]').text('总税额：'+subtaxes.toFixed(2));
            self.$el.find('[data-name="subcost"]').text('总计：'+subcost.toFixed(2));
        },

        goodsNoteCancel: function(e){
            e.preventDefault();
            e.stopPropagation();
            var modelobj = this.currentModel.toJSON();
            var answer = confirm('确定取消审核状态吗？');
            if (answer === false) {
                return false;
            }
            var id = modelobj._id;

            dataService.getData( '/goodsInNotes/NotesCancel', {
                id    : id
            }, function (response,context) {
                if(response.error){
                    var tempMessage = response.error.responseJSON.error.split('Error');
                    var message = tempMessage[0];
                    App.render({
                        type   : 'error',
                        message: message
                    });
                } else{
                    window.location.hash = '#easyErp/goodsInNotes';
                    return App.render({
                        type   : 'notify',
                        message: "入库单" + modelobj.name + '已取消审核。'
                    });
                }
            },this);
        },

        goodsNoteEdit: function(e){
            var content = 'edit';
            this.goodsInNew(e, content);
        },

        showEdit: function(e){
            e.preventDefault();
            e.stopPropagation();
            this.$el.find('.goodsNoteEdit').attr('hidden', false);
            this.$el.find('.editCancel').attr('hidden', false);
            this.$el.find('.editNote').attr('hidden', true);
            this.$('input').removeClass('statusInfo').attr('readonly', false);
        },

        editCancel: function(e){
            e.preventDefault();
            e.stopPropagation();
            this.render();
        },

        render: function () {
            var $thisEl = this.$el;
            var model = this.currentModel.toJSON();
            var formString;
            var template;
            var self = this;

            if (model.date) {
                model.date = moment(model.date).format('YYYY-MM-DD');
            }

            formString = this.template({
                model        : model,
                visible      : this.visible,
                hidePrAndCust: this.hidePrAndCust
            });

            template = this.templateDoc({
                model           : model,
                currencySplitter: helpers.currencySplitter
            });

            $thisEl.html(formString);

            $thisEl.find('#templateDiv').html(template);

            if (!model.status.approved) {
                this.$el.find('#date').datepicker({
                    dateFormat: 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                    minDate    : new Date(model.order.orderDate),
                    maxDate    : new Date()
                }).datepicker('setDate', new Date(model.date));
            }

            dataService.getData('/taxSettings/getForDd', {}, function (taxCode) {
                self.responseObj['#taxCode'] = taxCode.data;
            });

            if(model.isValid || (model.status.approved && model.description)){
                this.$('input').addClass('statusInfo').attr('readonly', true);
            }

            this.delegateEvents(this.events);

            App.stopPreload();

            return this;
        }
    });

    return FormView;
});
