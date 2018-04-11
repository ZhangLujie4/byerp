define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/oemOrders/list/ListHeader.html',
    'text!templates/stages.html',
    'views/oemOrders/uploadView',
    'views/oemOrders/oemCreateAllView',
    'views/oemOrders/list/ListItemView',
    'views/oemOrders/list/ListTotalView',
    'views/order/EditView',
    'models/oemOrderModel',
    'collections/oemOrders/filterCollection',
    'common',
    'dataService',
    'helpers',
    'constants'
], function (Backbone, $, _, listViewBase, listTemplate, stagesTamplate, uploadView, createAllView, ListItemView, ListTotalView, EditView, OrderModel, contentCollection, common, dataService, helpers, CONSTANTS) {
    'use strict';
    var OrdersListView = listViewBase.extend({
        CreateAllView    : createAllView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: contentCollection,
        contentType      : 'oemOrders',
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

        goodsItem: function (type) {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            var $checkedInputs;
            var ids = [];
            $checkedInputs = $table.find('input:checked');

            if(type){
                var type = type;
            } else {
                var type = 'RI';
            }

            $.each($checkedInputs, function () {
                var $el = $(this);

                ids.push($el.val());
            });
            var result = [];

            ids = _.compact(ids);
            var CreateAllView = this.CreateAllView;
            if(ids.length){
                 dataService.getData( 'oemOrders/getBySupplier', {
                    ids : ids
                }, function (response,context) {
                    var EmptyOem = '';
                    var isCreate = true;
                    response.forEach(function(row){
                        if(row.paymentInfo.total == 0){
                            isCreate = false;
                            EmptyOem = EmptyOem.concat('  ' + row.name);
                        }
                    });
                    if(isCreate == false){
                        return App.render({
                            type   : 'error',
                            message: '来料订单' + EmptyOem + '的总价为零，需要先进行合价操作！'
                        });
                    } else{
                        return new CreateAllView({orderModels: response, type: type});
                    }
                },this);
            } else{
                return App.render({
                    type   : 'error',
                    message: '请选择要入库的订单！'
                });
            }
           
        },

        goodsOutItem: function () {
            var self = this;
            var type = 'RO';
            this.goodsItem(type);
        },

        goodsFInItem: function () {
            var self = this;
            var type = 'FI';
            this.goodsItem(type);
        },

        goodsFOutItem: function () {
            var self = this;
            var type = 'FO';
            this.goodsItem(type);
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
                wId         : 'oem Order',
                source      : 'purchase',
                targetSource: 'order'
            }, function (stages) {
                self.stages = stages;
            });
        }

    });
    return OrdersListView;
});
