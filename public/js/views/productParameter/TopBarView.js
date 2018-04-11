define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/productParameter/TopBarTemplate.html',
    'custom',
    'common',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, Custom, Common, CONSTANTS) {
    var TopBarView = BaseView.extend({
        el            : '#top-bar',
        contentType   : 'productParameter',
        actionType    : null, // Content, Edit, Create
        template      : _.template(ContentTopBarTemplate),

        events: {
            'click #top-bar-parameter-createBtn': 'onCreateEvent',
            'click #top-bar-formula': 'onFormulaEvent'
        },

        onCreateEvent: function (event) {
            event.preventDefault();
  
            this.trigger('createEvent');
        },

        onFormulaEvent: function (event) {
            event.preventDefault();
  
            this.trigger('editEvent');
        },
    });

    return TopBarView;
});
