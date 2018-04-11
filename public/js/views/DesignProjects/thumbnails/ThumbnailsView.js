define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/DesignProjects/thumbnails/ThumbnailsItemTemplate.html',
    'views/selectView/selectView',
    'views/thumbnailsViewBase'
], function (Backbone, $, _, thumbnailsItemTemplate, selectView, BaseView) {
    'use strict';
    var ProjectThumbnalView = BaseView.extend({
        el           : '#content-holder',
        template     : _.template(thumbnailsItemTemplate),
        newCollection: true,
        contentType  : 'DesignProjects',

        initialize: function (options) {
            $(document).off('click');

            BaseView.prototype.initialize.call(this, options);
        },

        events: {

        },

        gotoEditForm: function (e) {
            var id;

            e.preventDefault();
            App.ownContentType = true;
            id = $(e.target).closest('.thumbnail').attr('id');

            window.location.hash = '#easyErp/DesignProjects/form/' + id;

            App.projectInfo = App.projectInfo || {};
            App.projectInfo.currentTab = 'overview';
        },


        render: function () {
            var $currentEl = this.$el;
            $currentEl
                .find('#thumbnailContent')
                .append(this.template({collection: this.collection.toJSON()}));
            return this;
        }
    });

    return ProjectThumbnalView;
});
