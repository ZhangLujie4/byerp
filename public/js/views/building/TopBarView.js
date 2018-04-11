define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/building/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'building',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
