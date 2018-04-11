define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/accept/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'accept',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
