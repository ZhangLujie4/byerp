define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/goodsPlan/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType:  CONSTANTS.GOODSPLAN,
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
