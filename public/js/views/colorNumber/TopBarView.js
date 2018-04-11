define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/colorNumber/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: '色号管理',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
