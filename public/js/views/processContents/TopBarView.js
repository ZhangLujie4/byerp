define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/processContents/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: '加工内容',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
