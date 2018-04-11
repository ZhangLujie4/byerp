define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/oemOrders/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.OEMORDERS,
        contentHeader: '来料加工订单',
        template     : _.template(ContentTopBarTemplate),

        events: {
            'click #top-bar-rawsinBtn'     : 'onGoodsEvent',
            'click #top-bar-rawsoutBtn'    : 'OutGoodsEvent',
            'click #top-bar-finishedinBtn' : 'manufacturesInGoodsEvent',
            'click #top-bar-finishedoutBtn': 'manufacturesOutGoodsEvent',
            'click #top-bar-uploadBtn'     : 'uploadEvent'
        },

        onGoodsEvent: function (event) {
            event.preventDefault();
            this.trigger('goodsEvent');
        },

        OutGoodsEvent: function (event) {
            event.preventDefault();
            this.trigger('goodsOutEvent');
        },

        manufacturesInGoodsEvent: function (event) {
            event.preventDefault();
            this.trigger('goodsFInEvent');
        },

        manufacturesOutGoodsEvent: function (event) {
            event.preventDefault();
            this.trigger('goodsFOutEvent');
        },

        uploadEvent: function(event) {
            event.preventDefault();
            this.trigger('uploadEvent');
        }
    });

    return TopBarView;
});
