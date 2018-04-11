define([
    'Underscore',
    'views/topBarViewBase',
    'views/selectView/selectView',
    'text!templates/timeCard/TopBarTemplate.html',
    'collections/timeCard/filterCollection',
    'constants',
    'custom',
    'common',
    'moment',
    'dataService'
], function (_, BaseView, SelectView, ContentTopBarTemplate, FilterCollection, CONSTANTS, Custom, common, moment, dataService) {
    'use strict';

    var topBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : 'timeCard',
        contentHeader: 'timeCard',
        template     : _.template(ContentTopBarTemplate),
          events: {
            'click #cancelBtn' : 'cancel',
            'click #top-bar-copy'  : 'copyEvent',
            'click #top-bar-generate'     : 'generateEvent',
            'click .editable'      : 'showNewSelect',
            'click .newSelectList li:not(.miniStylePagination)'     : 'changeType',
            click                                                   : 'removeInputs'
        },

        generateEvent: function (event) {
            event.preventDefault();
            this.trigger('generateEvent');
        },

        cancel: function (e) {
            var targetEl = $(e.target);
            var ul = targetEl.closest('ul.frameDetail');

            ul.addClass('hidden');
        },

        copyEvent: function (event) {
            event.preventDefault();
            this.trigger('copyEvent');
        },

        showNewSelect: function (e) {
            var models;
            var $target = $(e.target);

            dataService.getData('Departments/getType', {}, function(response, context){
                    var types = [];
                    for(var i=0; i<response[0].type.length; i++){
                        var type = {
                            name: response[0].type[i],
                            _id: response[0].type[i]
                        };
                        types.push(type);
                    }
                    e.stopPropagation();

                    if (context.selectView) {
                        context.selectView.remove();
                    }

                    context.selectView = new SelectView({
                        e          : e,
                        responseObj: {'#type': types}
                    });

                    $target.append(context.selectView.render().el);
                    return false;
                }, this);

        },

        changeType: function (e) {

            var target = $(e.target);
            var targetElement = target.closest('.editable').find('span');
            var tempClass = target.attr('class');
            var self = this;
            var redirectUrl;

            targetElement.text(target.text());
            if (target.length) {
                this.Type = target.attr('id');
            } else {
                this.$el.find('.editable').find('span').text(self.Type ? self.Type.name : '111Select');
                this.$el.find('.editable').attr('data-id', self.Type ? self.Type._id : null);
            }

            Custom.cacheToApp('timeCardDateRange', {
                type: this.Type
            });

            this.trigger('changeDateRange');

        },

        removeInputs: function () {
            if (this.selectView) {
                this.selectView.remove();
            }
        },

        render: function () {
            var dateRange = Custom.retriveFromCash('timeCardDateRange');
            var viewType = Custom.getCurrentVT();

            $('title').text(this.contentType);

            this.type = dateRange.type;

            this.$el.html(this.template({
                viewType   : viewType,
                contentType: this.contentType,
                type       : this.type
            }));

            return this;
        }

    });

    return topBarView;
});
