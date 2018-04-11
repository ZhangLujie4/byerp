define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/enterprise/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'taxCategories',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
