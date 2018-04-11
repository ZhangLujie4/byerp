define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/projectRoyalty/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'projectRoyalty',
        template   : _.template(ContentTopBarTemplate)

    });

    return TopBarView;
});
