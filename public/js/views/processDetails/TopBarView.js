define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/processDetails/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'ProcessDetails',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
