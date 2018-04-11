define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/bankInfo/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'bankInfo',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
