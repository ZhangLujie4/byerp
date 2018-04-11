define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/stampApplication/TopBarTemplate.html'
], function (_, BaseView, TopBarTemplate) {
    'use strict';
    var TopBarView = BaseView.extend({
        contentType     : 'stampApplication',
        collectionLength: 0,
        template        : _.template(TopBarTemplate),
        events: {
            'click #top-bar-affirmBtn' : 'affirmEvent'
        },

        affirmEvent: function(event){
            event.preventDefault();

            this.trigger('affirmEvent');
        }
    });

    return TopBarView;
});
