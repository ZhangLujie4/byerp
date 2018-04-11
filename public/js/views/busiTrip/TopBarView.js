define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/busiTrip/topBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var topBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.BUSITRIP,
        contentHeader: 'BusiTrip',
        template     : _.template(ContentTopBarTemplate),
    });

    return topBarView;
});
