define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/chargeItems/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: '收费项目',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
