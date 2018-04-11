define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/borrowAffirm/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.BORROWAFFIRM,
        template   : _.template(ContentTopBarTemplate),
        events: {
            'click #top-bar-affirmBtn'      : 'affirmEvent',
            'click #top-bar-editBtn'        : 'disagreeEvent',
        },
        affirmEvent: function (event) {
            event.preventDefault();

            this.trigger('affirmEvent');
        },

        disagreeEvent: function (event) {
            event.preventDefault();

            this.trigger('editEvent');
        },

    });
    
    
    return TopBarView;
});
