define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/purchaseOrders/list/ListHeader.html',
    'text!templates/stages.html',
    'views/purchaseOrders/uploadView',
    'views/purchaseOrders/CreateView',
    'views/goodsInNotes/CreateAllView',
    'views/purchaseOrders/list/ListItemView',
    'views/purchaseOrders/list/ListTotalView',
    'views/order/EditView',
    'models/orderModel',
    'collections/purchaseOrders/filterCollection',
    'common',
    'dataService',
    'helpers',
    'constants',
    'async'
], function (Backbone, $, _, listViewBase, listTemplate, stagesTamplate, uploadView, createView, createAllView, ListItemView, ListTotalView, EditView, OrderModel, contentCollection, common, dataService, helpers, CONSTANTS, async) {
    'use strict';
    var OrdersListView = listViewBase.extend({
        CreateView       : createView,
        CreateAllView    : createAllView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: contentCollection,
        contentType      : 'purchaseOrders',
        hasPagination    : true,

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.filter = options.filter || {};
            this.filter.forSales = {
                key  : 'forSales',
                type : 'boolean',
                value: ['false']
            };
            this.formUrl = 'easyErp/' + this.contentType + '/tform/';
            this.forSales = false;
            this.sort = options.sort;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.page;

            listViewBase.prototype.initialize.call(this, options);

            this.contentCollection = contentCollection;
        },

        recalcTotal: function () {
            var total = 0;
            var balance = 0;
            var paid = 0;

            _.each(this.collection.toJSON(), function (model) {
                total += parseFloat(model.paymentInfo.total);
                balance += parseFloat(model.paymentBalance);
                paid += parseFloat(model.paymentsPaid);
            });

            this.$el.find('#total').text(helpers.currencySplitter(total.toFixed(2)));
            this.$el.find('#balance').text(helpers.currencySplitter((balance / 100).toFixed(2)));
            this.$el.find('#paid').text(helpers.currencySplitter((paid / 100).toFixed(2)));
        },

        uploadItem: function(){
            return new uploadView();
        },

        goodsItem: function () {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            var $checkedInputs;
            var ids = [];
            $checkedInputs = $table.find('input:checked');

            $.each($checkedInputs, function () {
                var $el = $(this);

                ids.push($el.val());
            });
            var result = [];

            ids = _.compact(ids);
            var CreateAllView = this.CreateAllView;
            if(ids.length){
                 dataService.getData( 'purchaseOrders/getBySupplier', {
                    ids : ids
                }, function (response,context) {
                    var flag = true;
                    response.forEach(function(order){
                        if (order.workflow.status == 'New') {
                            flag = false;
                            return App.render({
                                type   : 'error',
                                message: '订单'+order.name+'尚未审核！'
                            });
                        }
                    });
                    if(flag == true){
                        return new CreateAllView({orderModels: response});
                    }
                },this);
            }
            else{
                return App.render({
                    type   : 'error',
                    message: '请选择要入库的订单！'
                });
            }
           
        },

        deleteItems: function () {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            var $checkedInputs;
            var ids = [];
            var answer;
            var edited = this.edited || $thisEl.find('tr.false, #false');
            var modelobj = this.collection.toJSON();
            var orders = '';
            var flag = true;

            if (!edited.length) { // ToDo refactor
                this.changed = false;
            }

            if (this.changed) {
                return this.cancelChanges();
            }

            answer = confirm('确定要删除记录吗?!');

            if (answer === false) {
                return false;
            }

            $checkedInputs = $table.find('input:checked');

            $.each($checkedInputs, function () {
                var $el = $(this);

                ids.push($el.val());
            });

            ids = _.compact(ids);

            async.eachSeries(ids, function(id, cb){
                var order = _.find(modelobj, function(num){
                    return num._id == id;
                });

                if(order.workflow.status != "New"){
                    flag = false;
                    orders = orders.concat(orders , ' ' , order.name);
                };
                cb(null);
            }, function(err){
                if (err) {
                    console.log(err);
                }

                if(flag == false){
                    return App.render({
                        type   : 'error',
                        message: orders + '订单已审核，无法删除！'
                    });
                } else{
                    dataService.deleteData(url, {contentType: self.contentType, ids: ids}, function (err, response) {
                        if (err) {
                            return App.render({
                                type   : 'error',
                                message: err.responseJSON.error
                            });
                        }
                        url = window.location.hash;
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(url, {trigger: true});
                    });
                }
            })
        },

        chooseOption: function (e) {
            var self = this;
            var target$ = $(e.target);
            var targetElement = target$.parents('td');
            var id = targetElement.attr('id');
            var model = this.collection.get(id);

            model.save({
                workflow: target$.attr('id')
            }, {
                headers: {
                    mid: 55
                },

                patch   : true,
                validate: false,
                success : function () {
                    self.showFilteredPage(self.filter, self);
                }
            });

            this.hideNewSelect();
            return false;
        },

        showNewSelect: function (e) {
            if ($('.newSelectList').is(':visible')) {
                this.hideNewSelect();
                return false;
            }
            $(e.target).parent().append(_.template(stagesTamplate, {stagesCollection: this.stages}));
            return false;

        },

        gotoForm: function (e) {
            var id = $(e.target).closest('tr').data('id');
            var page = this.collection.currentPage;
            var countPerPage = this.collection.pageSize;
            var url = this.formUrl + id + '/p=' + page + '/c=' + countPerPage;

            if (this.filter) {
                url += '/filter=' + encodeURI(JSON.stringify(this.filter));
            }

            if ($(e.target).closest('tfoot').length) {
                return;
            }

            App.ownContentType = true;
            Backbone.history.navigate(url, {trigger: true});
        },

        hideNewSelect: function () {
            $('.newSelectList').remove();
        },

        render: function () {
            var self;
            var $currentEl;
            $('.ui-dialog ').remove();

            self = this;
            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render()); // added two parameters page and items number
            $currentEl.append(new ListTotalView({element: this.$el.find('#listTable'), cellSpan: 7}).render());

            this.recalcTotal();

            dataService.getData(CONSTANTS.URLS.WORKFLOWS_FETCH, {
                wId         : 'Purchase Order',
                source      : 'purchase',
                targetSource: 'order'
            }, function (stages) {
                self.stages = stages;
            });
        }

    });
    return OrdersListView;
});
