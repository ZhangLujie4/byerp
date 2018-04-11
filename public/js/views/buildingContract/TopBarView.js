define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/buildingContract/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: '建材合同',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
