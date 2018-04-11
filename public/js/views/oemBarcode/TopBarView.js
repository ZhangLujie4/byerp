define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/oemBarcode/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'oemBarcode',
        template   : _.template(ContentTopBarTemplate),

        events: {
            'click #top-bar-uploadBtn'      : 'uploadEvent',
            'click #top-bar-goodsinBtn'     : 'onGoodsEvent',
        },

        uploadEvent: function(event) {
            event.preventDefault();
            this.trigger('uploadEvent');
        },

        onGoodsEvent: function (event) {
            event.preventDefault();
            this.trigger('goodsEvent');
        }
        
    });

    return TopBarView;
});
