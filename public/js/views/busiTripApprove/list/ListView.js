define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/busiTripApprove/list/listHeader.html',
    'views/busiTripApprove/EditView',
    'views/busiTripApprove/ApproveView',
    'views/busiTripApprove/list/ListItemView',
    'models/busiTripModel',
    'collections/busiTripApprove/filterCollection',
    'collections/busiTripApprove/editCollection',
    'common',
    'dataService',
    'populate',
    'async',
    'constants',
    'helpers/keyCodeHelper'
], function (Backbone, $, _, ListViewBase, listTemplate, EditView, ApproveView, ListItemView, currentModel, contentCollection, EditCollection, common, dataService, populate, async, CONSTANTS, keyCodes) {
    'use strict';

    var busiTripApproveListView = ListViewBase.extend({
        contentType  : CONSTANTS.BUSITRIPAPPROVE,
        viewType     : 'list',
        responseObj  : {},
        hasPagination: true,
        listTemplate : listTemplate,
        ListItemView : ListItemView,
        changedModels: {},

        initialize: function (options) {
            $(document).off('click');

            this.currentModel = currentModel;

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
            'click .list tbody td:not(.notForm, .validated)'   : 'goToEditDialog',
        },



        bindingEventsToEditedCollection: function (context) {
            if (context.editCollection) {
                context.editCollection.unbind();
            }

            context.editCollection = new EditCollection(context.collection.toJSON());
            context.editCollection.on('saved', context.savedNewModel, context);
            context.editCollection.on('updated', context.updatedOptions, context);
        },


        goToEditDialog: function(e){
            var id = $(e.target).closest('tr').data('id');
            var model = this.collection.get(id);
            var self = this;
            e.preventDefault();
            if(model.attributes.isApproved){
                return new ApproveView({
                model : model});
            }
            else{
                return new EditView({
                model : model});
            }
            
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
                itemsNumber: this.collection.numberToShow
            }).render()); // added two parameters page and items number

            // this.renderPagination(this.$el);

            setTimeout(function () {
                self.editCollection = new EditCollection(self.collection.toJSON());
                self.editCollection.on('saved', self.savedNewModel, self);
                self.editCollection.on('updated', self.updatedOptions, self);

                self.$listTable = $('#listTable');
            }, 10);

            return this;
        }
    });

    return busiTripApproveListView;
});

