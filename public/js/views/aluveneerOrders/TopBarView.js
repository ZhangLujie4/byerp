define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/aluveneerOrders/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'AluveneerOrders',
        template   : _.template(ContentTopBarTemplate),

        events: {
            'click #top-bar-uploadBtn'      : 'uploadEvent'
        },

        uploadEvent: function(event) {
            event.preventDefault();
            this.trigger('uploadEvent');
        }

    });

    return TopBarView;
});
