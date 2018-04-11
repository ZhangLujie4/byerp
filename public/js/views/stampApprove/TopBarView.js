define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/stampApprove/TopBarTemplate.html'
], function (_, BaseView, TopBarTemplate) {
    'use strict';
    var TopBarView = BaseView.extend({
        contentType     : 'stampApprove',
        collectionLength: 0,
        template        : _.template(TopBarTemplate),
    });

    return TopBarView;
});
