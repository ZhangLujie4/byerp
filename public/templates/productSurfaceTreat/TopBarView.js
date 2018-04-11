define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/productSurfaceTreat/TopBarTemplate.html',
    'custom',
    'common',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, Custom, Common, CONSTANTS) {
    var TopBarView = BaseView.extend({
        el            : '#top-bar',
        contentType   : CONSTANTS.PRODUCTS,
        actionType    : null, // Content, Edit, Create
        template      : _.template(ContentTopBarTemplate),
    });

    return TopBarView;
});
