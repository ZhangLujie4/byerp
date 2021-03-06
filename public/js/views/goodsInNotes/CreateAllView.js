define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/goodsInNotes/CreateAllTemplate.html',
    'text!templates/goodsInNotes/ProductAllItems.html',
    'models/goodsInNotesModel',
    'common',
    'populate',
    'constants',
    'helpers/keyValidator',
    'helpers',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, ProductItems, GoodsModel, common, populate, CONSTANTS, keyValidator, helpers, dataService) {

    var CreateAllView = ParentView.extend({
        el         : '#content-holder',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.orderModels = options.orderModels;
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
                inputEl.val(0);
                return App.render({
                    type   : 'error',
                    message: "仓库不可为空,请先选择仓库！"
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

            // if (val < diff && !$div.next().length && (lengthLocations !== ($siblingDivs.length + 1))) {
            //     $parent.find('td[data-name="newShip"]').append('<div class="receiveLocation">' +
            //         '<div><input id="newShip" class="quantity" maxlength="9" value="' + (diff - val) + '"> into</div>' +
            //         '<div> <a class="current-selected" id="locationDd" href="javascript:;" data-id="">Select</a></div>' +
            //         '<span title="Delete" class="icon-close5 removeLocation"></span></div>');
            // }

            if (val > diff || val < 0) {
                inputEl.val(diff);
            }

            this.changeTax(e);
        },

        changeTax: function (e) {
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var val;
            var taxes = parseFloat($parent.find('.current-selected.taxCode').attr('data-level')) || 0;
            var subtotal = $parent.find('[data-name="subTotal"] input').val() || $parent.find('[data-name="subTotal"]').text() || 0;
            var quantity = $parent.find('[data-name="ordered"] input').val() || 0;
            var selectedQuantity = $parent.find('#newShip').val() || 0;
            var selectTotal = subtotal * selectedQuantity/quantity;
            var taxesAccount = selectTotal/(1+taxes)*(taxes);
            taxesAccount = taxesAccount.toFixed(2);
            $parent.find('.taxesAccount').val(taxesAccount);
        },

        saveItem: function () {
            var x;
            var self = this;
            var warehouse = this.$el.find('#warehouseDd').attr('data-id');
            var shippinglist = this.$el.find('#shippinglist').val();
            var date = helpers.setTimeToDate(this.$el.find('#date').val());
            var shippingCost = $.trim(this.$el.find('#shippingCost').val()) || 0;
            var shippingMethod = this.$el.find('#shippingMethods').attr('data-id');
            var orderRow;
            var orderRowId;
            var quantity;
            var targetEl;
            var saveObject;
            var products = [];
            var productAvailable;
            var i;
            var _model;
            var selectedProducts =self.$el.find('.productItem');
            var selectedLength = selectedProducts.length;
            var locationsReceived;
            var ordered;
            var unit;
            var taxCode;
            var taxesAccount;
            var order = this.orderModels[0]._id;

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
                var priceQty = targetEl.attr('data-priceQty');
                var unitPrice = parseFloat(targetEl.attr('data-unitPrice'));
                ordered = parseFloat(targetEl.find('#ordered').val());
                taxCode = targetEl.find('.current-selected.taxCode').attr('data-id');
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

                if(priceQty && priceQty > 0){
                    unit = priceQty/ordered;
                } else {
                    unit = 0;
                }



                if (locationsReceived.length) {
                    products.push({
                        orderRowId       : orderRowId,
                        locationsReceived: locationsReceived,
                        product          : productAvailable,
                        quantity         : quantity,
                        unitPrice        : unitPrice/100,
                        cost             : unitPrice,
                        unit             : unit,
                        taxCode          : taxCode,
                        tax              : taxesAccount
                    });
                } else if ( locationsReceived.length == 0 && quantity != 0) {
                    return App.render({
                    type   : 'error',
                    message: '请选择库位！'
                    });
                }

            }

            if (!products.length) {
                return App.render({
                    type   : 'error',
                    message: '没有产品入库！'
                });
            }

            saveObject = {
                warehouse     : warehouse,
                order         : order,
                date          : date,
                shippinglist  : shippinglist,
                shippingMethod: shippingMethod,
                shippingCost  : shippingCost,
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
                var taxCode = _.findWhere(this.responseObj['#taxCodeLine'], {_id: $target.attr('id')});

                if (taxCode && taxCode._id) {
                    $target.parents('td').find('#taxCodeLine').attr('data-level', taxCode.rate);
                }

                this.changeTax(e);
            }

            if (type === 'warehouseDd') {
                $target.find('#warehouseDd').text($target.text()).attr('data-id', $target.attr('id'));
                this.selectLocation($(e.target).attr('id'));
            }

            $target.closest('.current-selected').text($target.text()).attr('data-id', id);

            this.hideNewSelect();

            return false;
        },

        selectLocation: function (id) {
            if (id !== '') {
                dataService.getData( 'warehouse/location/getForDd', {
                    warehouse : id
                }, function (response, context) {
                    var location = response.data;

                    if (location) {
                        var locationDd;

                        locationDd = _.map(location, function (location) {
                            locationDd = {
                                _id   : location._id,
                                name  : location.name
                            }

                            return locationDd;
                        });

                        context.responseObj['#locationDd'] = locationDd;
                        context.$el.find('.locationDd').text(locationDd[0].name).attr('data-id', locationDd[0]._id);
                    }
                }, this);
            } else {
                this.$el.find('.locationDd').val('');
            }
        },

        render: function () {
            var orderModels = this.orderModels;
            var formString = this.template({model: orderModels});
            var shippingMethod = orderModels[0].shippingMethod;
            var self = this;

            var warehouse = orderModels[0].warehouse ? orderModels[0].warehouse._id : '';

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : '80%',
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

            populate.get('#warehouseDd', 'warehouse/getForDD', {}, 'name', this, false)
            populate.get('#shippingMethods', '/shippingMethod/getForDd', {}, 'name', this, false, false, shippingMethod);
            
            dataService.getData('/taxSettings/getForDd', {}, function (taxCode) {
                self.responseObj['#taxCodeLine'] = taxCode.data;
                self.$el.find('.taxCode').text(taxCode.data[0].name).attr('data-id', taxCode.data[0]._id).attr('data-level', taxCode.data[0].rate);
            });

            this.delegateEvents(this.events);

            this.$el.find('#productItemsHolder').html(_.template(ProductItems, {orderModels : orderModels}));
            return this;
        }

    });

    return CreateAllView;
});
