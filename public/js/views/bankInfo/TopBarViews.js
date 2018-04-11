/**
 * Created by admin on 2017/6/30.
 */
define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/bankInfo/TopBarTemplates.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'bankInfo',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
