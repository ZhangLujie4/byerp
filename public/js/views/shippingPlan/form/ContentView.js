define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/tformViewBase',
    'text!templates/shippingPlan/form/ContentTemplate.html',
    'text!templates/shippingPlan/form/ListItemTemplate.html',
    'views/shippingPlan/form/FormView',
    'models/shippingPlanModel',
    'text!templates/shippingPlan/form/FormTemplate.html',
    'views/shippingPlan/list/ListItemView',
    'views/Filter/filterView',
    'helpers',
    'common',
    'constants',
    'jstree'
], function (Backbone, $, _, TFormBaseView, ContentTemplate, ListItemTemplate, FormView, GoodsOutModel, formTemplate, ListItemView, FilterView, helpers, common, CONSTANTS, jstree) {
    'use strict';

    var StockCorrectionsView = TFormBaseView.extend({
        listTemplate   : _.template(ListItemTemplate),
        contentTemplate: _.template(ContentTemplate),
        ListItemView   : ListItemView,
        listUrl        : 'easyErp/shippingPlan/list/',
        contentType    : CONSTANTS.SHIPPINGPLAN,
        viewType       : 'tform',
        hasPagination  : true,
        hasAlphabet    : false,
        formView       : null,
        selectedId     : null,
        ContentModel   : GoodsOutModel,
        FormView       : FormView,

        hideSaveButton: function () {
            $('#top-bar-saveBtn').hide();
            $('#top-bar-createBtn').hide();
        },

        saveItem: function() {
            var self = this;
            var mid = 39;
            var load = $.trim(this.$el.find('#load').val());
            var unLoad = $.trim(this.$el.find('#unLoad').val());
            var date = $.trim(this.$el.find('#date').val());
            var description = $.trim(this.$el.find('#description').val());
            var model = this.currentModel.toJSON();
            var approved = model.status.approved;
            if(approved){
                return App.render({
                    type   : 'error',
                    message: '已审核 不能进行编辑'
                })
            }

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

            var data = {
                load: load,
                unLoad: unLoad,
                date: date,
                orderRows: orderRows,
                description: description
            };

            this.currentModel.save(data, {
                patch  : true,
                headers: {
                    mid: mid
                },
                success: function(){
                    self.hideSaveButton();
                    var url = window.location.hash;
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
                },
                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        renderList     : function (collection) {
            var $thisEl = this.$el;
            var $listHolder = $thisEl.find('#listContent');

            $listHolder.append(this.listTemplate({
                collection : collection,
                common : common
            }));
        },

        /*renderFormView: function (modelId, cb) {
            var self = this;
            var model;

            model = new this.ContentModel();

            model.fetch({
                data: {
                    id: modelId
                }
            },{
                success: function (model) {

                    if (self.formView) {
                        self.formView.undelegateEvents();
                    }

                    self.currentModel = model;
                    self.formView = new self.FormView({
                        model: model,
                        el   : '#formContent'
                    });
                    self.formView.render();

                    self.selectItem(modelId);

                    self.listenTo(self.formView, 'itemChanged', self.changeList);
                    self.selectedId = model.id || model.get('model')._id; //TODO change

                    if (cb && typeof cb === 'function') {
                        cb();
                    }
                },

                error: function () {
                    App.render({
                        type   : 'error',
                        message: 'Server error'
                    });
                }
            });
        }*/
    });

    return StockCorrectionsView;
});