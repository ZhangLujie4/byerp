define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/busiTripApprove/topBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    'use strict';

    var topBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.BUSITRIPAPPROVE,
        contentHeader: 'BusiTripApprove',
        template     : _.template(ContentTopBarTemplate),

        events: {
            'click #top-bar-editBtn'                           : 'editEvent',
        },

        editEvent: function(){
            event.preventDefault();
            this.trigger('editEvent');
        },

    });

    return topBarView;
});
