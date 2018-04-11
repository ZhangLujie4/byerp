define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/settingsStamp/TopBarTemplate.html'
], function (_, BaseView, TopBarTemplate) {
    'use strict';
    var TopBarView = BaseView.extend({
        contentType     : 'settingsStamp',
        collectionLength: 0,
        template        : _.template(TopBarTemplate)
    });

    return TopBarView;
});
