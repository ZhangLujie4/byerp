/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/royaltyDetails/list/ListHeader.html',
    'views/royaltyDetails/list/ListItemView',
    'views/royaltyDetails/CreateView',
    'views/royaltyDetails/EditTotalView',
    'collections/royaltyDetails/filterCollection',
    'models/royaltyDetailsModel',
    'dataService',
    'populate',
    'async',
    'helpers'
], function (Backbone, $, _, ListViewBase, listTemplate, ListItemView, CreateView, EditView, Collection, CurrentModel, dataService, populate, async, helpers) {
    'use strict';

    var ListView = ListViewBase.extend({

        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentType      : 'royaltyDetails',
        modelId          : null,
        $listTable       : null,
        editCollection   : null,
        contentCollection: Collection,
        changedModels    : {},
        responseObj      : {},
        template         : _.template(listTemplate),
        hasPagination    : true,

        events: {
            // 'change .editable '                                : 'setEditable',
            // 'click .newSelectList li:not(.miniStylePagination)': 'chooseOption',
            'click .goEdit' : 'goToEditTotal'
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

        createItem: function () {
            return new CreateView({
                collection: this.collection
            });
        },

        goToEditTotal: function (e) {
            var tr = $(e.target).closest('tr');
            var _id = tr.attr('data-id');
            return new EditView({
                model: this.collection.get(_id).toJSON()
            });
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

            return this;
        }
    });

    return ListView;
});
