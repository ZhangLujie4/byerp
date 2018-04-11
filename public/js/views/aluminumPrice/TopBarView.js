define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/aluminumPrice/TopBarTemplate.html',
    'dataService',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, dataService, CONSTANTS) {
    var TopBarView = BaseView.extend({
        el : '#top-bar',
        contentType: CONSTANTS.ALUMINUMPRICE,
        template   : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
