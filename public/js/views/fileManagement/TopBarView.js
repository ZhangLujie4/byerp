define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/fileManagement/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.FILEMANAGEMENT,
        template   : _.template(ContentTopBarTemplate),
        events: {
            'click #top-bar-borrowBtn'      : 'borrowEvent',
            'click #top-bar-returnBtn'      : 'returnEvent',
            'click #top-bar-borrowAllBtn'   : 'borrowAllEvent',
            'click #top-bar-watchAllBtn'    : 'watchAllEvent'
        },
        borrowEvent: function (event) {
            event.preventDefault();

            this.trigger('borrowEvent');
        },

        borrowAllEvent: function(event){
            event.preventDefault();

            this.trigger('borrowAllEvent');
        },

        returnEvent: function (event) {
            event.preventDefault();

            this.trigger('returnEvent');
        },

        watchAllEvent: function(event){
            event.preventDefault();
            this.trigger('watchAllEvent');
        }
    });
    
    
    return TopBarView;
});
