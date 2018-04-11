define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/JobPositions/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : 'JobPositions',
       //contentHeader: 'Job Positions',
       contentHeader: '岗位',
        actionType   : null,
        template     : _.template(ContentTopBarTemplate)
    });
    return TopBarView;
});
