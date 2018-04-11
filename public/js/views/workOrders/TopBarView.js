define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/workOrders/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: '生产制造令',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
