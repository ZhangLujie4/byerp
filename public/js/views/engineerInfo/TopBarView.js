define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/engineerInfo/TopBarTemplate.html'
], function (_, BaseView, TopBarTemplate) {
    'use strict';
    var TopBarView = BaseView.extend({
        contentType     : 'engineerInfo',
        collectionLength: 0,
        template        : _.template(TopBarTemplate),
        events: {
        }

    });

    return TopBarView;
});
