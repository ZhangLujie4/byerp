define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/oemNotes/form/FormTemplate.html',
    'text!templates/oemNotes/temps/documentTemp.html',
    'views/dialogViewBase',
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
        contentType: 'oemNotes',
        imageSrc   : '',
        template   : _.template(EditTemplate),
        templateDoc: _.template(DocumentTemplate),
        responseObj: {},

        events: {
            'click .editNote'           : 'showEdit',
            'click .CreateOutNote'      : 'CreateOutNote',
            'keyup td[data-name=quantity] input' : 'priceChange',
            'click .editCancel'         : 'editCancel'
        },

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

            this.currentModel.urlRoot = '/oemNotes';

            this.currentModel.on('sync', this.render, this);
            this.responseObj = {};

        },

        showEdit: function(e){
            e.preventDefault();
            e.stopPropagation();
            this.$el.find('.CreateOutNote').attr('hidden', false);
            this.$el.find('.editCancel').attr('hidden', false);
            this.$el.find('.editNote').attr('hidden', true);
            this.$el.find('.quantity').removeClass('statusInfo').attr('readonly', false);
        },

        editCancel: function(e){
            e.preventDefault();
            e.stopPropagation();
            this.$el.find('.CreateOutNote').attr('hidden', true);
            this.$el.find('.editCancel').attr('hidden', true);
            this.$el.find('.editNote').attr('hidden', false);
            this.$el.find('.quantity').addClass('statusInfo').attr('readonly', true);
        },

        priceChange:function(e){
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var quantity = parseFloat($parent.find('[data-name="quantity"] input').val()) || parseFloat($parent.find('[data-name="quantity"]').text()) || 0;
            var Planqty = parseFloat($parent.find('[data-name="Planqty"] input').val()) || parseFloat($parent.find('[data-name="Planqty"]').text()) || 0;
            if(quantity > Planqty || quantity < 0){
                $parent.find('[data-name="quantity"] input').val(Planqty);
                quantity = Planqty;
            };

            var thisEl = this.$el;
            var totalContainer = thisEl.find('[data-name="subcost"] span');
            var qtyContainer = thisEl.find('[data-name="subqty"] span');
            var resultForCalculate = thisEl.find('tr.productItem');
            var totalUntax = 0;
            var totalEls;
            var $currentEl;
            var subqty = 0;
            var cost;
            var i;
            totalEls = resultForCalculate.length;
            if (totalEls) {
                for (i = totalEls - 1; i >= 0; i--) {
                    $currentEl = $(resultForCalculate[i]);
                    Planqty = parseFloat($currentEl.find('[data-name="Planqty"] input').val()) || 0;
                    quantity = parseFloat($currentEl.find('[data-name="quantity"] input').val()) || 0;
                    cost = parseFloat($currentEl.find('[data-name="subtotal"] input').val()) || parseFloat($currentEl.find('[data-name="subtotal"]').text()) || 0;
                    cost = cost*(quantity/Planqty);
                    subqty += quantity;
                    totalUntax += cost;
                }
            }
            totalContainer.text(totalUntax.toFixed(2));
            qtyContainer.text(subqty);
        },

        CreateOutNote: function(e){
            e.preventDefault();
            e.stopPropagation();
            var thisEl = this.$el;
            var resultForCalculate = thisEl.find('tr.productItem');
            var totalUntax = parseFloat(this.$el.find('[data-name="subcost"] span').text());
            var totalEls;
            var $currentEl;
            var subqty = 0;
            var cost;
            var i;
            var oemOutNote;
            var orderRows = [];
            var orderRowsPlan = [];
            var unit;
            var unitPrice;
            var area = 0;
            var quantity;
            var model = this.currentModel.toJSON();
            var answer;
            answer = confirm('确认是否要制定发货单？');
            totalEls = resultForCalculate.length;
            if (totalEls && answer) {
                for (i = totalEls - 1; i >= 0; i--) {
                    $currentEl = $(resultForCalculate[i]);
                    quantity = parseFloat($currentEl.find('[data-name="quantity"] input').val()) || 0;
                    unitPrice = parseFloat($currentEl.find('[data-name="unitPrice"] input').val()) || $currentEl.find('[data-name="unitPrice"]').text() || 0;
                    cost = parseFloat($currentEl.find('[data-name="subtotal"] input').val()) || $currentEl.find('[data-name="subtotal"]').text() || 0;
                    unit = parseFloat($currentEl.find('[data-name="unit"] input').val()) || $currentEl.find('[data-name="unit"]').text() || 0;
                    subqty += quantity;
                    area += (unit*quantity);
                    orderRows.push({
                        orderRowId       : model.orderRows[i]._id,
                        product          : model.orderRows[i].product,
                        quantity         : quantity,
                        unit             : unit,
                        unitPrice        : unitPrice,
                        cost             : unitPrice*100
                    });
                    orderRowsPlan.push({
                        orderRowId       : model.orderRows[i]._id,
                        product          : model.orderRows[i].product,
                        Planqty          : model.orderRows[i].Planqty,
                        quantity         : quantity,
                        unit             : model.orderRows[i].unit,
                        unitPrice        : model.orderRows[i].unitPrice,
                        cost             : model.orderRows[i].cost
                    });
                }

                oemOutNote = {
                    oemNote         : model._id,
                    shipDate        : model.date,
                    totalQuantity   : subqty,
                    orderRows       : orderRows,
                    area            : area,
                    price           : totalUntax
                };

                dataService.postData( '/oemNotes/oemOutCreate', {
                    id   : model._id,
                    body : oemOutNote,
                    orderRows : orderRowsPlan
                }, function (response,context) {
                    window.location.hash = '#easyErp/oemNotes';
                },this);
            }
        },

        render: function () {
            var $thisEl = this.$el;
            var model = this.currentModel.toJSON();
            var formString;
            var template;
            var self = this;
            console.log(model);

            if (model.date) {
                model.date = moment(model.date).format('DD MMM, YYYY, H:mm');
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

            if (!model.status.shipped) {
                this.$el.find('#date').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    minDate    : new Date(model.order.orderDate),
                    maxDate    : new Date()
                }).datepicker('setDate', new Date(model.date));
            }

            this.delegateEvents(this.events);

            App.stopPreload();

            return this;
        }
    });

    return FormView;
});
