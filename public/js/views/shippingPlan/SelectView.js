define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/shippingPlan/SelectTemplate.html',
    'text!templates/shippingPlan/ProductItems.html',
    'text!templates/shippingPlan/goodsNoteItems.html',
    'views/shippingPlan/BarCodeView',
    'models/shippingPlanModel',
    'collections/shippingPlan/editCollection',
    'common',
    'populate',
    'constants',
    'helpers/keyValidator',
    'dataService',
    'helpers',
    'custom',
    'jstree'
], function (Backbone, $, _, ParentView, CreateTemplate, ProductItems, goodsNoteItems, BarCodeView, GoodsModel, GoodsCollection, common, populate, CONSTANTS, keyValidator, dataService, helpers, custom, jstree) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'goodsOutNote',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.collection = new GoodsCollection();
            this.orderModel = options.orderModel;
            this.render();
            this.responseObj = {};
            this.changedQuantity = _.debounce(this.changedQuantity, 250);
            this.collection.on('saved', this.reRenderPage, this);
        },

        events: {
            'click .removeJob': 'deleteRow',
            'keypress  .quantity': 'keypressHandler',
            'keyup  input.quantity': 'changedQuantity',
            'click .goToEdit': 'goToEdit',
            'click #checkAllOrderRows': 'checkAll',
            'click #getNewShipBtn': 'getNewShip',
            'click .checkbox': 'checked'
        },

        reRenderPage: function () {
            this.hideDialog();
            Backbone.history.fragment = '';
            Backbone.history.navigate(window.location.hash, {trigger: true});
        },

        keypressHandler: function (e) {
            return keyValidator(e);
        },

        changedQuantity: function (e) {
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var type = inputEl.attr('id');
            var available = parseInt($parent.find('#onHand').val());
            var val;

            if (!inputEl.length) {
                inputEl = $parent.find('textarea');
            }
            val = parseInt(inputEl.val());

            if (!val) {
                val = 0;
            }

            e.preventDefault();

            if (type === 'newOnHand') {
                $parent.find('#adjusted').val(val - available);
            } else {
                $parent.find('#newOnHand').val(val + available);
            }

        },

        saveItem: function () {
            var self = this;
            var order = this.orderModel.id;
            var model = this.orderModel.toJSON();
            var checkNewShip = true;
            var name = this.orderModel.get('name');
            var date = helpers.setTimeToDate(this.$el.find('#date').val());
            var load = this.$el.find('#load').val();
            var unLoad = this.$el.find('#unLoad').val();
            var description = this.$el.find('#description').val();
            var _model;

            var data = $('#jstree_div').jstree(true).get_selected(true);
            var orderRows = [];
            for(var i=0; i<data.length; i++){
                if(!data[i].children.length){
                    var barId = data[i].id
                    var parent = $('#jstree_div').jstree(true).get_node(data[i].parent);
                    var orderRowId = parent.id;
                    var product = parent.original.product;
                    if(!orderRows.length){
                        var item = {
                            orderRowId: orderRowId,
                            product: product,
                            barCodes: [barId]
                        }
                        orderRows.push(item);
                    }
                    else{
                        var flag = false;
                        for(var j=0; j<orderRows.length; j++){
                            if(orderRows[j].orderRowId == orderRowId && orderRows[j].product == product){
                                orderRows[j].barCodes.push(barId);
                                flag = true;
                            }
                        }
                        if(!flag){
                            var item = {
                                orderRowId: orderRowId,
                                product: product,
                                barCodes: [barId]
                            }
                            orderRows.push(item);
                        }
                    }
                }
            }

            for(var n=0; n<orderRows.length; n++){
                orderRows[n].quantity = orderRows[n].barCodes.length;
            }

            if (!orderRows.length) {
                App.render({
                    type: 'error',
                    message: '发货数量为零，请先选择产品！'
                }); 
                return;
            } else{
                saveObject = {
                    order    : order,
                    name     : name,
                    date     : date,
                    orderRows: orderRows,
                    load     : load,
                    unLoad   : unLoad,
                    description: description
                };

                _model = new GoodsModel(saveObject);
                self.collection.add(_model);
                this.collection.save();
            }
        },

        deleteRow: function (e) {
            var target = $(e.target);
            var tr = target.closest('tr');
            var id = tr.attr('id');
            var deleteArr = [];

            if (id) {
                deleteArr.push(id);
            }
            e.stopPropagation();
            e.preventDefault();

            dataService.deleteData('/shippingPlan', {ids: deleteArr}, function (err) {
                if (!err) {
                    tr.remove();
                }

            });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var id = $target.attr('id');
            var type = $target.closest('a').attr('id');

            var $row = $target.closest('.productItem,deleteItem');
            var product = $row.find('#productsDd').attr('data-id');

            if (type === 'warehouseDd') {
                dataService.getData('warehouse/getAvailability', {warehouse: id, product: product}, function (data) {

                    if (data) {
                        $row.find('.warehouseOnHand').text('(' + (data.onHand || 0) + ') on Hand');
                    } else {
                        $row.find('.warehouseOnHand').text('');
                    }

                });
                $row.attr('data-id', id);
            }
            $target.closest('.current-selected').text($target.text()).attr('data-id', id);

            this.hideNewSelect();

            return false;
        },


        render: function () {
            if(custom.retriveFromCash('barCodesForRows') != null){
                custom.removeFromCash('barCodesForRows');
            }
            var orderModel = this.orderModel.toJSON();
            var formString = this.template({model: orderModel});
            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog',
                width      : 1050,
                position   : {
                    at: "top+35%"
                },

                title  : '创建出库单',
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
                minDate    : new Date(this.orderModel.toJSON().orderDate)
            }).datepicker('setDate', new Date());

            $('#jstree_div').jstree({
              plugins: ["checkbox", "sort", "types", "wholerow", "search", "unique", "contextmenu"],   
              'core': {   
                  'multiple': true,   
                  'data' : function (obj, callback){  
                            $.ajax({
                                url : "/aluveneerOrders/getAluOrder",
                                data: {id: orderModel._id},
                                dataType : "json",  
                                type : "GET",  
                                success : function(data) {
                                    if(data.length) {
                                        callback.call(this, data);
                                    }else{  
                                        $("#jstree_div").html("暂无数据！");  
                                    } 
                                },
                                error: function(xhr,textStatus){
                                    console.log(xhr);
                                }
                            });  
                        }
              }
            });

            populate.get('#locationDd', 'warehouse/location/getForDd', {}, 'name', this, false);
            populate.get('#warehouseDd', 'warehouse/getForDD', {}, 'name', this, false);

            this.delegateEvents(this.events);

            this.$el.find('#productItemsHolder').html(_.template(ProductItems, {products: orderModel.products}));

            this.$el.find('#goodsHolder').html(_.template(goodsNoteItems, {goodsNotes: orderModel.goodsNotes}));
                        
            return this;
        },

        goToEdit: function(e) {
            var tr = $(e.target).closest('tr');
            var orderRowId = tr.attr('data-id');
            var model = this.orderModel.toJSON();
            var barCodes = [];

            e.preventDefault();

            for(var j=0; j<model.products.length; j++){
                if(orderRowId === model.products[j]._id){
                    barCodes = model.products[j].barCodes;
                }
            }

            if(barCodes.length === 0){
                App.render({
                    type: 'error',
                    message: '没有可出库产品！'
                });            
            }else{
                return new BarCodeView({barCodes : barCodes, orderRowId : orderRowId});
            }
        },

        checkAll: function (e) {
            var $thisEl = this.$el;
            var $el = e ? $(e.target) : $thisEl.find('#checkAllOrderRows');
            var $checkedContent = $thisEl.find('.list');

            var $checkboxes = $checkedContent.find(':checkbox');
            var check = $el.prop('checked');

            $checkboxes.prop('checked', check);
        },

        getNewShip: function (e) {
            var self = this;
            var order = this.orderModel.id;
            var model = this.orderModel.toJSON();
            var $thisEl = this.$el;
            var $table = $thisEl.find('.list');
            var $checkedInputs;
            var ids = [];
            var isCheck;
            var name = this.orderModel.get('name');
            var selectedProducts = self.$el.find('.productItem');
            var selectedLength = selectedProducts.length;
            var barCodesForRows = custom.retriveFromCash('barCodesForRows');
            var barCodes;

            $checkedInputs = $table.find('input:checked');

            $.each($checkedInputs, function (index, each) {
                var $el = $(this);
                ids.push($el.val());
            });

            ids = _.compact(ids);

            for (var i = selectedLength - 1; i >= 0; i--) {
                isCheck = false;
                targetEl = $(selectedProducts[i]);
                orderRowId = targetEl.attr('id');
                barCodes = [];

                for(var j=0; j<ids.length; j++){
                    if(ids[j] === orderRowId){
                        isCheck = true;
                    }
                }

                if(isCheck){
                    for(var j=0; j<model.products.length; j++){
                        if(orderRowId === model.products[j]._id){
                            barCodes = model.products[j].barCodes;
                        }
                    }
                }else if(barCodesForRows !== null){
                    for(var j=0; j<barCodesForRows.length; j++){
                        if(barCodesForRows[j].orderRowId === orderRowId){
                            barCodes = barCodesForRows[j].barCodes;
                        }
                    }
                }
                
                targetEl.find('#newShip').val(barCodes.length);
            }
        },

        checked: function (e) {
            var $thisEl = this.$el;
            var $checkBoxes = $thisEl.find('.checkbox:checked:not(#checkAll)');
            var $checkAll = $thisEl.find('#checkAllOrderRows');
            var checkAllBool = ($checkBoxes.length === this.orderModel.toJSON().products.length);

            $checkAll.prop('checked', checkAllBool);
        }
    });

    return CreateView;
});
