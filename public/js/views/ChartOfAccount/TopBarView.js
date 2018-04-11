define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/ChartOfAccount/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.CHARTOFACCOUNT,
        contentHeader: '会计科目表',
        template     : _.template(ContentTopBarTemplate)
    });
    return TopBarView;
});
