define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/purchaseOrders/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.PURCHASEORDERS,
        contentHeader: '采购订单',
        template     : _.template(ContentTopBarTemplate),

        events: {
            'click #top-bar-goodsinBtn'     : 'onGoodsEvent',
            'click #top-bar-uploadBtn'      : 'uploadEvent'
        },

        onGoodsEvent: function (event) {
            event.preventDefault();
            this.trigger('goodsEvent');
        },

        uploadEvent: function(event) {
            event.preventDefault();
            this.trigger('uploadEvent');
        }
    });

    return TopBarView;
});
