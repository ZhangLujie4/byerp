define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/workPoint/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.WORKPOINT,

        template: _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
