define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/designRec/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'DesignRec',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
