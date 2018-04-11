define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/dailyReport/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.DAILYREPORT,
        contentHeader: 'DailyReport',
        template: _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
