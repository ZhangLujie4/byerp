define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/reports/MainTemplate.html',
    'views/reports/inventoryReports/ContentView',
    'views/reports/salesReports/ContentView',
    'views/Dashboard/ContentView'
], function (Backbone, $, _, mainTemplate, inventoryReportsView, salesReportsView, crmView) {
    'use strict';

    var ContentView = Backbone.View.extend({
        contentType: 'reports',
        actionType : 'Content',
        template   : _.template(mainTemplate),
        el         : '#content-holder',

        initialize: function (options) {
            this.startTime = options.startTime;

            this.views = {};

            /*this.views.productsReportsView = {
             view       : productsReportsView,
             redirectRef: '#easyErp/productsReports'
             };*/

            this.views.inventoryReportsView = {
                view       : inventoryReportsView,
                redirectRef: '#easyErp/inventoryReports'
            };

            this.views.salesReportsView = {
                view       : salesReportsView,
                redirectRef: '#easyErp/salesReports'
            };

            this.views.stockInventory = {
                trigger    : true,
                redirectRef: '#easyErp/stockInventory/list'
            };

            this.views.crmReports = {
                view       : crmView,
                redirectRef: '#easyErp/Dashboard'
            };

            this.render();
        },

        events: {
            'click .mainSettings': 'chooseDetails'
        },

        selectMenuItem: function (url) {
            var $rootElement = $('#submenuHolder').find('li.root');
            var li;

            $rootElement.find('li.opened').removeClass('opened');
            $rootElement.find('ul.opened').removeClass('opened');
            $rootElement.find('li.active').removeClass('active');
            $rootElement.find('li.selected').removeClass('selected');

            li = $rootElement.find('[href="' + url + '"]').closest('li');

            li.addClass('selected');
            li.closest('ul').closest('li').addClass('active opened');
        },

        chooseDetails: function (e) {
            var $target = $(e.target);
            var $parentDiv = $target.closest('.mainSettings');
            var id = $parentDiv.attr('id');
            var type = $parentDiv.attr('data-type');
            var viewObject = this.views[id];
            var View = viewObject.view;
            var url = viewObject.redirectRef;
            var options = viewObject.trigger ? {trigger: true} : {};

            e.stopPropagation();
            e.preventDefault();

            Backbone.history.navigate(url, options);

            $('#content-holder').html('');
            $('#top-bar').hide();

            if (View) {
                this.selectMenuItem(url);
                return new View({type: type});
            }

        },

        render: function () {
            this.$el.html(this.template({
                salesReports: {
                    _id : 'salesReportsView',
                    type: 'info_by_sales',
                    name: '销售报表',
                    data: [
                        {
                            _id        : 'salesReportsView',
                            type       : 'info_by_sales',
                            name       : '销售产品',
                            //description: 'Monitor your amount of sold products on one page with ease'
                            description: '在一页上监控销售产品的数量'
                        }, {
                            _id        : 'salesReportsView',
                            type       : 'month_sales',
                            name       : '销售月份',
                            //description: 'Analyze your growth by monthly sales and total revenue'
                            description: '按月销售额和总收入分析你的增长'
                        },
                        {
                            _id        : 'salesReportsView',
                            type       : 'channel_sales',
                            name       : '销售渠道',
                            //description: 'Know what sales channel brings the most profit for your company'
                            description: '了解哪个销售渠道给你的公司带来最大的利益'
                        }
                    ]
                },

                inventoryReports: {
                    _id : 'inventoryReportsView',
                    type: 'low_stock',
                    name: '库存报表',
                    data: [{
                        _id        : 'inventoryReportsView',
                        type       : 'low_stock',
                        name       : '低库存',
                        //description: 'Control the level of each product on all your warehouses and locations'
                        description: '控制你所有仓库和位置上的每个产品的水平'
                    }, {
                        _id        : 'inventoryReportsView',
                        type       : 'incoming_stock',
                        name       : '收入库存',
                        //description: 'See all goods you have already purchased and which will be shipped to you soon'
                        description: '查看你已购买的所有商品,以及即将发货给你的商品'
                    }, {
                        _id        : 'inventoryReportsView',
                        type       : 'product_listing',
                        name       : '产品列表',
                        //description: 'View sale orders for each sold unit from all your eCommerce channels'
                        description: '查看你的电子商务渠道中所有的销售订单'
                    }]
                },

                stockInventory: {
                    _id : 'stockInventory',
                    type: 'stock_inventory',
                    name: '仓库详情',
                    data: [{
                        _id        : 'stockInventory',
                        type       : 'stock_inventory',
                        name       : '仓库详情',
                        //description: 'Get real-time data for all products you have in-stock on your warehouses'
                        description: '获取仓库中所有库存产品的实时数据'
                    }]
                }
                /*  crmReports: {
                 _id : 'crmReports',
                 type: 'leadsByResearcher',
                 name: 'CRM Reports',
                 data: [{
                 _id : 'crmReports',
                 type: 'leadsByResearcher',
                 name: 'Leads By Manager'
                 }, {
                 _id : 'crmReports',
                 type: 'leadsBySource',
                 name: 'Leads By Source'
                 }, {
                 _id : 'crmReports',
                 type: 'opportunityConversion',
                 name: 'Opportunity Conversion'
                 }, {
                 _id : 'crmReports',
                 type: 'opportunityAging',
                 name: 'opportunityAging'
                 }, {
                 _id : 'crmReports',
                 type: 'opportunities',
                 name: 'Opportunities'
                 }, {
                 _id : 'crmReports',
                 type: 'wonLost',
                 name: 'Won / Lost'
                 }, {
                 _id : 'crmReports',
                 type: 'salesByCountry',
                 name: 'Sales By Country'
                 }, {
                 _id : 'crmReports',
                 type: 'leadsByDate',
                 name: 'Leads By Date'
                 }, {
                 _id : 'crmReports',
                 type: 'leadsByNames',
                 name: 'Leads By Names'
                 }]
                 }*/
            }));

            $('#top-bar').show();

            return this;
        }

    });

    return ContentView;
});

