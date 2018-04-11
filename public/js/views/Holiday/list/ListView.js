define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Holiday/list/ListHeader.html',
    'text!templates/Holiday/list/cancelEdit.html',
    'views/Holiday/CreateView',
    'views/Holiday/list/ListItemView',
    'views/selectView/selectView',
    'models/HolidayModel',
    'collections/Holiday/filterCollection',
    'collections/Holiday/editCollection',
    'dataService',
    'constants',
    'async',
    'moment'
], function (Backbone,
             $,
             _,
             ListViewBase,
             listTemplate,
             cancelEdit,
             CreateView,
             ListItemView,
             SelectView,
             CurrentModel,
             contentCollection,
             EditCollection,
             dataService,
             CONSTANTS,
             async,
             moment) {
    'use strict';

    var HolidayListView = ListViewBase.extend({
        page          : null,
        sort          : null,
        listTemplate  : listTemplate,
        ListItemView  : ListItemView,
        contentType   : CONSTANTS.HOLIDAY, // needs in view.prototype.changeLocationHash
        changedModels : {},
        holidayId     : null,
        cancelEdit    : cancelEdit,
        CreateView  : CreateView,

        initialize: function (options) {
            $(document).off('click');

            this.CreateView = CreateView;
            this.CurrentModel = CurrentModel;

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.contentCollection = contentCollection;

            this.render();
        },

        events: {
            'click .checkbox'      : 'checked',
            'click .oe_sortable'   : 'goSort'
        },

        render: function () {
            var self = this;
            var $currentEl = this.$el;
            $('.ui-dialog ').remove();

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render()); // added two parameters page and items number

            this.renderPagination($currentEl, this);

            $currentEl.append('<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return HolidayListView;
});
