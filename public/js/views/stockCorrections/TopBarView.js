define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/stockCorrections/topBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var topBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.STOCKCORRECTIONS,
        contentHeader: '调库',
        template     : _.template(ContentTopBarTemplate)
    });

    return topBarView;
});
