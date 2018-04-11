define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/taxCategories/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'taxCategories',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
