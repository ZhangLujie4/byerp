define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/produceSchedule/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'produceSchedule',
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
