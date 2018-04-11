define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/goodsPlan/form/FormView',
    'text!templates/goodsPlan/form/EditTemplate.html',
    'views/NoteEditor/NoteView',
    'views/goodsPlan/form/ProductItems',
    'common',
    'dataService',
    'helpers'
], function(Backbone, $, _, ParentView, EditTemplate, NoteEditor, ProductItemView, common, dataService, helpers) {

    var EditView = ParentView.extend({
        contentType: 'goodsPlan',
        template: _.template(EditTemplate),
        service: false,
        el: '.form-holder',

        initialize: function(options) {

            _.bindAll(this, 'render', 'saveItem');
           
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = '/goodsPlan';
                console.log(this.currentModel.toJSON())
            App.stopPreload();
        },

        changeAllocation: function(e) {
            var $target = $(e.target);
            $target.addClass('changed');
        },

        createAllocation: function(array, cb) {
            var body = {
                data: array,
                order: this.model.id,
                status:array.status
            };

            dataService.postData('goodsPlan/allocate', body, function(err) {
                if (err) {
                    App.render({
                        type: 'error',
                        message: err.message
                    });
                } else {
                    App.render({
                        type: 'notify',
                        message: '已成功设置分配！'
                    });
                }

                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, { trigger: true });

                if (cb && typeof cb === 'function') {
                    cb();
                }
            });
        },



        saveOrder: function(e) {
            e.preventDefault();
            this.saveItem();
        },

        closeOrder: function(e) {
            var _id = this.currentModel.toJSON()._id;
            dataService.patchData('/goodsPlan/updateWorkflow', { _id: _id }, function(err) {
                if (err) {
                    return console.log(err);
                }

                url = window.location.hash;

                Backbone.history.fragment = '';
                Backbone.history.navigate(url, { trigger: true });
            });
        },

        changedQuantity: function(e) {
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input[id="fufilled"]');
            var available = $parent.find('#allocated').val();
            var val;

            if (!inputEl.length) {
                inputEl = $parent.find('textarea');
            }
            val = parseInt(inputEl.val());

            if (!val) {
                val = 0;
            } else if (val > available) {
                val = available;
            }

            e.preventDefault();

            $targetEl.addClass('changed');
            $parent.find('#fufilled').val(val);
        },

        saveItem: function() {
            var self = this;
            var model = this.currentModel.toJSON();
            var thisEl = this.$el;
            var order = this.currentModel.id;
            var name = this.currentModel.get('name');
            var date = new Date();
            var selectedProducts = thisEl.find('.productItem');
            var selectedLength = selectedProducts.length;
            var targetEl;
            var allocated;
            var productId;
            var paId;
            var orderRowQuantity;
            var onHandQuantity;
            var changedAllocated;
            var newAllocated;
            var lastAllocated = 0;
            var newFulfilled;
            var allFulfilled = 0;
            var allocateProducts = [];
            var rows = [];
            var outProducts = [];
            var location;
            var fulfilled;
            var total=0;
            var orderTotal=0;
            var totalNewAllocate=0;
            var status=model.status;
            if (selectedLength) {
                for (i = selectedLength - 1; i >= 0; i--) {
                    targetEl = $(selectedProducts[i]);
                    orderRowId = targetEl.data('id');
                    orderRowQuantity = parseInt(targetEl.attr('data-quantity'));//planNumber
                    orderTotal+=orderRowQuantity;
                    productId = targetEl.attr('data-product');
                    paId = targetEl.attr('data-pa');
                    allocated = targetEl.find('.allocate').data('allocate');
                    fulfilled = parseInt(targetEl.attr('data-fulfilled')); //goodsoutnumber        
                    changedAllocated = targetEl.find('._toAllocated');//changedNumber
                    newAllocated = parseInt(changedAllocated.val());
                    onHandQuantity=parseInt(targetEl.find('.onHand').attr('data-hand'));
                         if (!isNaN(newAllocated)) {
                            totalNewAllocate+=newAllocated;
                            if(newAllocated>orderRowQuantity){
                                 return App.render({
                                    type: 'error',
                                    message: '分配数量不能大于计划数量！'
                               });
                            }
                            if(newAllocated<fulfilled){
                                 return App.render({
                                    type: 'error',
                                    message: '分配数量不能小于已领料数量！'
                               });
                            }
                            if(newAllocated>onHandQuantity){
                                 return App.render({
                                    type: 'error',
                                    message: '分配数量不能大于可用数量！'
                               });
                            }
                            allocateProducts.push({
                                paId: paId,//
                                orderRowId: orderRowId,
                                newAllocated: newAllocated,
                                oldAllocated:allocated
                            });
                        }  
                        else{
                            totalNewAllocate+=allocated;
                            allocateProducts.push({
                                paId: paId,//
                                orderRowId: orderRowId,
                                newAllocated: allocated,
                                oldAllocated:allocated
                            });
                        }
                }
                     if (allocateProducts && allocateProducts.length) {
                        var answer = confirm('确定要设置分配量（审核领料计划）吗？');
                        if (answer) {
                            if(totalNewAllocate==orderTotal)
                                status.allocateStatus='ALL'
                            else if(totalNewAllocate==0)
                                status.allocateStatus='NOT'
                            else
                                status.allocateStatus='NOA'
                            allocateProducts.status=status;
                            self.createAllocation(allocateProducts);
                        }
                    } 
         }
     },

        render: function() {
            var self = this;
            var $thisEl = this.$el;
            var formString;
            var productItemContainer;
            var buttons;
            var template;
            var timeLine;

            buttons = [{
                text: '保存',
                class: 'btn blue',
                click: function() {
                    self.saveItem();
                }
            }, {
                text: '取消',
                class: 'btn',
                click: function() {
                    self.hideDialog();
                }
            }];

            this.template = _.template(EditTemplate);
            $('.saveBtn').removeClass('hidden');

            formString = this.template({
                model: this.currentModel.toJSON(),
                visible: this.visible,
                forSales: this.forSales,
                dialog: this.dialog,
                common: common
            });

            $thisEl.html(formString);

            this.delegateEvents(this.events);;

            productItemContainer = this.$el.find('#productItemsHolder');

            if (this.onlyView) {
                this.notEditable = true;
            }

            this.ProductItemView = new ProductItemView({
                parentModel: self.model
            });

            productItemContainer.append(
                self.ProductItemView.render().el
            );

            

            return this;
        }
    });

    return EditView;
});