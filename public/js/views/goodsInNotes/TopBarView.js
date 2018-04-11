define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/goodsInNotes/TopBarTemplate.html',
    'custom',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, Custom, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.GOODSINNOTES,
        contentHeader: '入库明细',
        template     : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
