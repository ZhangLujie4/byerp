define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/goodsInNotes/CreateTemplate.html',
    'text!templates/goodsInNotes/ProductItems.html',
    'models/goodsInNotesModel',
    'common',
    'populate',
    'constants',
    'helpers/keyValidator',
    'helpers',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, ProductItems, GoodsModel, common, populate, CONSTANTS, keyValidator, helpers, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.orderModel = options.orderModel;
            this.render();
            this.responseObj = {};
            this.changedQuantity = _.debounce(this.changedQuantity, 250);
        },

        events: {
            'keypress  .quantity'   : 'keypressHandler',
            'click  .removeLocation': 'removeLocation',
            'keyup  input.quantity' : 'changedQuantity'
        },

        removeLocation: function (e) {
            var $target = $(e.target);
            var $div = $target.closest('div');

            $div.remove();
        },

        keypressHandler: function (e) {
            return keyValidator(e, true, true);
        },

        changedQuantity: function (e) {
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var ordered = parseFloat($parent.find('#ordered').val());
            var received = parseFloat($parent.find('#received').val());
            var $div = $targetEl.closest('.receiveLocation');
            var lengthLocations = this.responseObj['#locationDd'] ? this.responseObj['#locationDd'].length : 0;
            var $siblingDivs = $div.siblings();
            var prevQuantity = 0;
            var diff = ordered - received;
            var inputEl = $targetEl.closest('input');
            var val;
            var warehouse = this.$el.find('#warehouseDd').attr('data-id');

            if(!warehouse){
                return App.render({
                    type   : 'error',
                    message: "仓库不可为空！"
                });
            }

            if (!inputEl.length) {
                inputEl = $parent.find('textarea');
            }
            val = parseInt(inputEl.val());

            $siblingDivs.each(function () {
                prevQuantity += parseFloat($(this).find('input').val());
            });

            diff -= prevQuantity;

            if (!val) {
                val = 0;
            }

            e.preventDefault();

            if (val < diff && !$div.next().length && (lengthLocations !== ($siblingDivs.length + 1))) {
                $parent.find('td[data-name="newShip"]').append('<div class="receiveLocation">' +
                    '<div><input id="newShip" class="quantity" maxlength="9" value="' + (diff - val) + '"> into</div>' +
                    '<div> <a class="current-selected" id="locationDd" href="javascript:;" data-id="">Select</a></div>' +
                    '<span title="Delete" class="icon-close5 removeLocation"></span></div>');
            }

            if (val > diff) {
                inputEl.val(diff);
            }

            var taxes = parseFloat($parent.find('.current-selected.taxCode').attr('data-tax')) || 0;
            var subtotal = $parent.find('[data-name="subTotal"] input').val() || $parent.find('[data-name="subTotal"]').text() || 0;
            var quantity = $parent.find('[data-name="ordered"] input').val() || 0;
            var selectedQuantity = $parent.find('#newShip').val() || 0;
            var selectTotal = subtotal * selectedQuantity/quantity;
            var taxesAccount = selectTotal/(1+taxes)*(taxes);
            taxesAccount = taxesAccount.toFixed(2);
            $parent.find('.taxesAccount').val(taxesAccount);

        },

        changeTax: function (e) {
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var val;
            var taxes = parseFloat($parent.find('.current-selected.taxCode').attr('data-tax')) || 0;
            var subtotal = $parent.find('[data-name="subTotal"] input').val() || $parent.find('[data-name="subTotal"]').text() || 0;
            var quantity = $parent.find('[data-name="ordered"] input').val() || 0;
            var selectedQuantity = $parent.find('#newShip').val() || 0;
            var selectTotal = subtotal * selectedQuantity/quantity;
            var taxesAccount = selectTotal/(1+taxes)*(taxes);
            taxesAccount = taxesAccount.toFixed(2);
            $parent.find('.taxesAccount').val(taxesAccount);
        },

        saveItem: function () {
            var self = this;
            var order = this.orderModel.id;
            var name = this.orderModel.get('name');
            var orderRows = this.orderModel.get('products');
            var orderRow;
            var warehouse = this.$el.find('#warehouseDd').attr('data-id');
            var date = helpers.setTimeToDate(this.$el.find('#date').val());
            var shippingCost = $.trim(this.$el.find('#shippingCost').val()) || 0;
            var shippingMethod = this.$el.find('#shippingMethods').attr('data-id') || null;
            var shippinglist = this.$el.find('#shippinglist').val();
            var orderRowId;
            var quantity;
            var targetEl;
            var saveObject;
            var products = [];
            var value;
            var j;
            var productAvailable;
            var i;
            var _model;

            var selectedProducts = self.$el.find('.productItem');
            var selectedLength = selectedProducts.length;
            var locationsReceived;
            var ordered;
            var unit;
            var taxCode;
            var taxesAccount;

            if (!warehouse) {
                return App.render({
                    type   : 'error',
                    message: "仓库不可为空！"
                });
            }
            for (i = selectedLength - 1; i >= 0; i--) {
                targetEl = $(selectedProducts[i]);
                orderRowId = targetEl.attr('id');
                locationsReceived = [];
                productAvailable = targetEl.find('#productsDd').attr('data-id');
                quantity = 0;
                ordered = parseFloat(targetEl.find('#ordered').val());
                orderRow = _.findWhere(orderRows, {_id: orderRowId});
                taxCode = targetEl.find('.current-selected.taxCode').attr('data-id') || null;
                taxesAccount = parseFloat(targetEl.find('#taxesAccount').val()) || 0;

                targetEl.find('.receiveLocation').each(function () {
                    var quantityLocation = parseFloat($(this).find('.quantity').val()) || 0;
                    var location = $(this).find('#locationDd').attr('data-id');
                    if (location && quantityLocation) {
                        locationsReceived.push({
                            location: location,
                            quantity: quantityLocation
                        });
                        quantity += quantityLocation;
                    }
                });
                if(orderRow.priceQty && orderRow.priceQty > 0){
                    unit = orderRow.priceQty/orderRow.quantity;
                } else {
                    unit = 0;
                }


                if (locationsReceived.length) {
                    products.push({
                        orderRowId       : orderRowId,
                        locationsReceived: locationsReceived,
                        product          : productAvailable,
                        cost             : orderRow.unitPrice*100,
                        quantity         : quantity,
                        unitPrice        : parseFloat(orderRow.unitPrice),
                        unit             : unit,
                        taxCode          : taxCode,
                        tax              : taxesAccount
                    });
                }
            }

            if (!products.length) {
                return App.render({
                    type   : 'error',
                    message: '没有产品入库（未选择库位或数量均为0）'
                });
            }

            saveObject = {
                warehouse     : warehouse,
                order         : order,
                name          : name,
                date          : date,
                shippingMethod: shippingMethod,
                shippingCost  : shippingCost,
                shippinglist  : shippinglist,
                status        : {
                    received: true,
                    approved: false
                },

                orderRows: products
            };

            _model = new GoodsModel();

            _model.save(saveObject, {
                success: function () {
                    self.hideDialog();
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                }
            });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var id = $target.attr('id');
            var $parent = $target.closest('tr');
            var $existedLocation = $parent.find('[data-id="' + id + '"]');
            var type = $target.closest('a').attr('id');

            if (type === 'locationDd' && $existedLocation.length) {
                return false;
            }

            if (type === 'taxCodeLine') {
                var taxCode = _.findWhere(this.responseObj['#taxCode'], {_id: $target.attr('id')});

                if (taxCode && taxCode._id) {
                    $target.parents('td').find('.current-selected').attr('data-tax', taxCode.rate);
                }

                this.changeTax(e);
            }

            $target.closest('.current-selected').text($target.text()).attr('data-id', id);

            this.hideNewSelect();

            return false;
        },

        render: function () {
            var orderModel = this.orderModel.toJSON();
            var formString = this.template({model: orderModel});
            var shippingMethod = orderModel.shippingMethod;
            var self = this;

            var warehouse = orderModel.warehouse ? orderModel.warehouse._id : '';

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 1050,
                position   : {
                    at: "top+35%"
                },

                title  : '创建入库单',
                buttons: {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }
            });

            this.$el.find('#date').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : new Date()
            }).datepicker('setDate', new Date());

            populate.get('#warehouseDd', 'warehouse/getForDD', {}, 'name', this, false);

            populate.get('#locationDd', 'warehouse/location/getForDd', {warehouse: warehouse}, 'name', this);
            populate.get('#shippingMethods', '/shippingMethod/getForDd', {}, 'name', this, false, false, shippingMethod);
            dataService.getData('/taxSettings/getForDd', {}, function (taxCode) {
                self.responseObj['#taxCodeLine'] = taxCode.data;
                self.$el.find('.taxCode').text(taxCode.data[0].name).attr('data-id', taxCode.data[0]._id);
                self.$el.find('.taxCode').attr('data-tax', taxCode.data[0].rate);
            });

            this.delegateEvents(this.events);

            this.$el.find('#productItemsHolder').html(_.template(ProductItems, {products: orderModel.products}));
            return this;
        }

    });

    return CreateView;
});
