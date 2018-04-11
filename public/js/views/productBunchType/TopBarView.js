define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/productBunchType/TopBarTemplate.html',
    'custom',
    'common',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, Custom, Common, CONSTANTS) {
    var TopBarView = BaseView.extend({
        el            : '#top-bar',
        contentType   : CONSTANTS.PRODUCTBUNCHTYPE,
        actionType    : null, // Content, Edit, Create
        template      : _.template(ContentTopBarTemplate),
    });

    return TopBarView;
});
