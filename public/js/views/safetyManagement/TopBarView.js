define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/safetyManagement/TopBarTemplate.html'
], function (_, BaseView, TopBarTemplate) {
    'use strict';
    var TopBarView = BaseView.extend({
        contentType     : 'safetyManagement',
        collectionLength: 0,
        template        : _.template(TopBarTemplate)
    });

    return TopBarView;
});
