define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/goodsPlan/form/EditTemplate.html',
    'views/NoteEditor/NoteView',
    'views/goodsPlan/form/PickItemView',
    'common',
    'dataService',
    'helpers'
], function(Backbone, $, _, ParentView, EditTemplate, NoteEditor, PickItemView, common, dataService, helpers) {

    var PickView = ParentView.extend({
        contentType: 'goodsPlan',
        template: _.template(EditTemplate),
        service: false,
        el: '.form-holder',
        events: {
            'click .saveBtn': 'saveItem'
        },
        initialize: function(options) {
            _.bindAll(this, 'render', 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = '/goodsPlan';
            App.stopPreload();
        },

        saveOrder: function(e) {
            e.preventDefault();
            this.saveItem();
        },

        closeOrder: function(e) {
            var _id = this.currentModel.toJSON()._id;
            dataService.patchData('/goodsPlan/updateWorkflow', { _id: _id }, function(err) {
                if (err) {
                    console.log(err);
                }

                url = window.location.hash;

                Backbone.history.fragment = '';
                Backbone.history.navigate(url, { trigger: true });
            });
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
            var productId;
            var paId;
            var orderRowQuantity;
            var onHandQuantity;
            var changedAllocated;
            var allocated;
            var newFulfilled;
            var rows = [];
            var outProducts = [];
            var location;
            var fulfilled;
            var goodsInNoteObj = [];
            var lastorderRowId = 0;
            var totalPickNum = 0;
            var status=model.status;
            var flag=true;
            var totalAllocateNum=0;
            var totalFulfilledNum=0;
            $.each(model.products,function( index,item) {
                fulfilled = item.fulfilled;
                totalAllocateNum+=item.quantity;
                totalFulfilledNum+=fulfilled;
                var allocated = 0;
                item.pa.forEach(function(p) {
                    allocated += p.allocated;
                })
                var orderRowId = item._id;
                var array = $("[data-id='" + orderRowId + "']");
                var num = 0;
                $.each(array, function(index, item) {
                    var itemNum =parseInt($(item).find('.outNumber div input').val());
                    if(isNaN(itemNum))
                        itemNum=0;
                    num += itemNum;
                })
                if (num > allocated - fulfilled)
                    {
                      flag=false;
                      return App.render({
                       type: 'error',
                       message:item.product.name+'领料数量总额不能大于产品可领料数量！'
                      });
                      return false;
                      
            }

            })
              if(flag==false)
                 return false;
           
            if (selectedLength) {
                for (i = selectedLength - 1; i >= 0; i--) {
                    targetEl = $(selectedProducts[i]);
                    orderRowId = targetEl.data('id');
                    orderRowQuantity = parseInt(targetEl.attr('data-quantity'));
                    productId = targetEl.attr('data-product');
                    allocated = targetEl.attr('data-allocate');
                    paId = targetEl.attr('data-pa');
                    goodsInNoteId = targetEl.attr('data-goodsIn');
                    onHandQuantity = parseInt(targetEl.attr('data-hand'));
                    fulfilled = parseInt(targetEl.attr('data-fulfilled'));
                    newFulfilled = parseInt(targetEl.find('.outNumber div input').val());
                    location = targetEl.find('.locationDd').attr('data-location');
                    var index=parseInt(targetEl.attr('data-index'));
                    if (newFulfilled !== 0 && (!isNaN(newFulfilled))) {
                 
                        totalPickNum+=newFulfilled;

                        if (newFulfilled > onHandQuantity) {
                            return App.render({
                                type: 'error',
                                message: '第'+index+'条 领料数量不能大于库存数量！'
                            });
                        }

                        rows.push({
                            orderRowId: orderRowId,
                            eachQuantity: newFulfilled,
                            product: productId,
                            paId: paId,
                            goodsNoteId: goodsInNoteId,
                            location: location
                        });
                        goodsInNoteObj.push({
                            paId: paId,
                            goodsInNoteId: goodsInNoteId,
                            goodsInOnHand: onHandQuantity - newFulfilled,
                        })

                    }
                }
            }

            if (rows && rows.length !== 0) {
                var num;
                var locationDeliver = [];
                var answer = confirm('确定要出库（分批领料）吗？');
                if (answer) {
                    var i;
                    for (i = 0; i < rows.length; i++) {

                        var flag = false;
                        for (var j = 0; j < outProducts.length; j++) {

                            if (rows[i].orderRowId == outProducts[j].orderRowId) {
                                flag = true;
                                num = j;
                            }
                        }
                        if (flag) {
                            outProducts[num].quantity = outProducts[num].quantity + rows[i].eachQuantity;
                            outProducts[num].gnotesDeliver.push({
                                goodsInNoteId: rows[i].goodsNoteId,
                                location: rows[i].location,
                                quantity: rows[i].eachQuantity
                            });
                        } else {
                            var gnotesDeliver = [];
                            gnotesDeliver.push({
                                goodsInNoteId: rows[i].goodsNoteId,
                                location: rows[i].location,
                                quantity: rows[i].eachQuantity
                            });
                            outProducts.push({
                                orderRowId: rows[i].orderRowId,
                                quantity: rows[i].eachQuantity,
                                product: rows[i].product,
                                gnotesDeliver: gnotesDeliver
                            });
                        }
                    }
                }
            }
            if (outProducts.length) {
                var saveObject = {
                    order: order,
                    name: name,
                    date: date,
                    orderRows: outProducts
                };

                if(totalPickNum+totalFulfilledNum==totalAllocateNum)
                    status.fulfillStatus='ALL';
                else if(totalPickNum+totalFulfilledNum==0)
                    status.fulfillStatus='NOT';
                else
                    status.fulfillStatus='NOA';
      
                var body = {
                    data: goodsInNoteObj,
                    status:status,
                    order:order
                }
                dataService.postData('goodsPlan/updateNum', body, function(err, success) {
                    if (err) {
                        return App.render({
                            type: 'error',
                            message: '入库单数量更新失败！'
                        });
                    }
                    if(success){
                    dataService.postData('goodsOutNotes/', saveObject, function(error, success) {
                        if (error) {
                            return App.render({
                                type: 'error',
                                message: '出库单产生失败！'
                            });
                        } else {
                            url = window.location.hash;
                            Backbone.history.fragment = '';
                            Backbone.history.navigate(url, { trigger: true });

                            App.render({
                                type: 'notify',
                                message: '已成功产生出库单！'
                            });
                        }
                    });
                }
                })

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

            this.PickItemView = new PickItemView({
                parentModel: self.model
            });
            productItemContainer.append(
                self.PickItemView.render().el
            );
            self.model.toJSON().products.forEach(function(item, index) {

                    var productArr = $("[data-id=" + item._id + "]");

                    var len = productArr.length;
                    for (var i = 1; i <= len; i++) {
                        $(productArr[i]).children('.productsDd').remove();
                        $(productArr[i]).children("[data-name='parameter']").remove();
                        $(productArr[i]).children("[data-name='allocate']").remove();
                        $(productArr[i]).children("[data-name='picked']").remove();
                    }
                    $(productArr[0]).children('.productsDd').attr('rowspan', len)
                    $(productArr[0]).children("[data-name='parameter']").attr('rowspan', len)
                    $(productArr[0]).children("[data-name='allocate']").attr('rowspan', len)
                    $(productArr[0]).children("[data-name='picked']").attr('rowspan', len)
                })
              
            return this;
        }
    });

    return PickView;
});