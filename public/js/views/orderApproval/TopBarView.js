define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/orderApproval/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: '制造令审核',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
