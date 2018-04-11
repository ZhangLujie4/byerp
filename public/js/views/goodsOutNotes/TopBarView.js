define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/goodsOutNotes/TopBarTemplate.html',
    'custom',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, Custom, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.GOODSOUTNOTES,
        contentHeader: '审核出库',
        template     : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
