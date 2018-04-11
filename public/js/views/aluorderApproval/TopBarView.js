define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/aluorderApproval/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'AluorderApproval',
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
