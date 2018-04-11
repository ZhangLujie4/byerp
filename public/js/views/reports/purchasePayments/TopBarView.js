define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/customerPayments/TopBarTemplate.html',
    'custom',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, Custom, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.PURCHASEPAYMENTS,
        contentHeader      : '采购付款',
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
