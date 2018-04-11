define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/oemNotes/list/ListHeader.html',
    'views/oemNotes/list/ListItemView',
    'collections/oemNotes/filterCollection',
    'models/oemNotesModel',
    'dataService',
    'populate',
    'async',
    'helpers'
], function (Backbone, $, _, ListViewBase, listTemplate, ListItemView, Collection, CurrentModel, dataService, populate, async, helpers) {
    'use strict';

    var ListView = ListViewBase.extend({

        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentType      : 'oemNotes', // needs in view.prototype.changeLocationHash
        modelId          : null,
        $listTable       : null,
        editCollection   : null,
        contentCollection: Collection,
        changedModels    : {},
        responseObj      : {},
        template         : _.template(listTemplate),
        hasPagination    : true,

        events: {
            'change .editable '                                : 'setEditable',
            'click .newSelectList li:not(.miniStylePagination)': 'chooseOption'
        },

        initialize: function (options) {
            $(document).off('click');

            this.CurrentModel = CurrentModel;

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.formUrl = 'easyErp/' + this.contentType + '/tform/';
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.contentCollection = Collection;

            this.forSale = options.forSale;

            ListViewBase.prototype.initialize.call(this, options);
        },

        gotoForm: function (e) {
            var id = $(e.target).closest('tr').data('id');
            var page = this.collection.currentPage;
            var countPerPage = this.collection.pageSize;
            var url = this.formUrl + id + '/p=' + page + '/c=' + countPerPage;

            if (this.filter) {
                url += '/filter=' + encodeURI(JSON.stringify(this.filter));
            }

            App.ownContentType = true;
            Backbone.history.navigate(url, {trigger: true});
        },

        render: function () {
            var self = this;
            var $currentEl;

            $('.ui-dialog ').remove();

            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(this.template);
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());
            this.$listTable = $('#listTable');
            return this;
        }
    });

    return ListView;
});
