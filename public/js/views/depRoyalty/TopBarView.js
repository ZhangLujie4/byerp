/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/depRoyalty/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el : '#top-bar',
        contentType: '商务部提成信息',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});