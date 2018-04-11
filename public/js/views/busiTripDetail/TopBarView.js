define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/busiTripDetail/topBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var topBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.BUSITRIPDETAIL,
        contentHeader: 'BusiTripDetail',
        template     : _.template(ContentTopBarTemplate)
    });

    return topBarView;
});
