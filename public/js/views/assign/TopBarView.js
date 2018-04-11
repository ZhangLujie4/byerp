define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/assign/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'Assign',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
