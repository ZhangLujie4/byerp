/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/royaltyDetails/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.ROYALTYDETAILS,
        contentHeader: '投标工程提成',
        template     : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});