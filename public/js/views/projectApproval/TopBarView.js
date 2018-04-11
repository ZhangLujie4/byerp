define([
    'jQuery',
    'Underscore',
    'views/topBarViewBase',
    'text!templates/projectApproval/TopBarTemplate.html',
    'constants'
], function ($, _, TopBarBase, ContentTopBarTemplate, CONSTANTS) {
    var TopBarView = TopBarBase.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.PROJECTAPPROVAL,
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
