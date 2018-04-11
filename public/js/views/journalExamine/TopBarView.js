define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/journalExamine/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.JOURNAL,
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
