define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/orderReckons/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'OrderReckons',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
