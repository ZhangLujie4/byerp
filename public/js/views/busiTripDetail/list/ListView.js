define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/busiTripDetail/list/listHeader.html',
    'views/busiTripDetail/EditView',
    'views/busiTripDetail/list/ListItemView',
    'models/busiTripModel',
    'collections/busiTripDetail/filterCollection',
    'collections/busiTripDetail/editCollection',
    'common',
    'dataService',
    'populate',
    'async',
    'constants',
    'helpers/keyCodeHelper'
], function (Backbone, $, _, ListViewBase, listTemplate, EditView, ListItemView, currentModel, contentCollection, EditCollection, common, dataService, populate, async, CONSTANTS, keyCodes) {
    'use strict';

    var busiTripDetailListView = ListViewBase.extend({
        contentType  : 'busiTripDetail',
        viewType     : 'list',
        responseObj  : {},
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
            'click .stageSelect'                               : 'showNewSelect',
            click                                              : 'hideItemsNumber',
            'change .editable '                                : 'setEditable',
            'click .newSelectList li:not(.miniStylePagination)': 'chooseOption',
            'click .list tbody td:not(.notForm, .validated)'   : 'goToEditDialog'
        },
        
        deleteItems: function () {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            console.log(url);
            var $checkedInputs;
            var ids = [];
            var answer;

            answer = confirm('真的要删除吗 ?!');

            if (answer === false) {
                return false;
            }

            $checkedInputs = $table.find('input:checked');

            $.each($checkedInputs, function () {
                var $el = $(this);

                ids.push($el.val());
            });

            ids = _.compact(ids);

            dataService.patchData(url, {contentType: this.contentType, ids: ids}, function (err, response) {
                if (err) {
                    return App.render({
                        type   : 'error',
                        message: '不能删除'
                    });
                }
                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
        },

         checked: function(e){
            var $thisEl = this.$el;
            var $topBar = $('#top-bar');
            var $checkBoxes = $thisEl.find('.checkbox:checked:not(#checkAll,notRemovable)');
            var notRemovable = $thisEl.find('.notRemovable');
            var $checkAll = $thisEl.find('#checkAll');
            var $currentChecked = e ? $(e.target) : $thisEl.find('#checkAll');
            var isCheckedAll = $currentChecked.attr('id') === 'checkAll';
            var checkAllBool = (($checkBoxes.length + notRemovable.length) === this.collection.length);
            var $deleteButton = $topBar.find('#top-bar-deleteBtn');
            var $createButton = $topBar.find('#top-bar-createBtn');
            var $editButton = $topBar.find('#top-bar-editBtn');
            var $saveButton = $topBar.find('#top-bar-saveBtn');
            var changedRows;
            var haveNewRow;

            changedRows = this.changedModels ? Object.keys(this.changedModels) : null;
            haveNewRow = $thisEl.find('#false, .false').length;

            if (e) {
                e.stopPropagation();
            }

            $checkAll.prop('checked', checkAllBool);

            if ((!isCheckedAll && $checkBoxes.length == 1) || (isCheckedAll && !checkAllBool)) {
                $deleteButton.show();
                $editButton.hide();
                $createButton.hide();
            } 
            else if((!isCheckedAll && $checkBoxes.length > 1) || (isCheckedAll && !checkAllBool)){
                $deleteButton.show();
                $editButton.hide();
                $createButton.hide();
            }
            else {
                $deleteButton.hide();
                $editButton.hide();
                $createButton.hide();
            }

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
            var status = model.attributes.status;
            console.log(status);
            if(status == 0 || status == -2){
                return new EditView({
                  model : model});
            }
            else{
                 return App.render({
                        type   : 'error',
                        message: '正在审批中不能编辑'
                    });
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

            this.renderPagination(this.$el);

            setTimeout(function () {
                self.editCollection = new EditCollection(self.collection.toJSON());
                self.editCollection.on('saved', self.savedNewModel, self);
                self.editCollection.on('updated', self.updatedOptions, self);

                self.$listTable = $('#listTable');
            }, 10);

            return this;
        }
    });

    return busiTripDetailListView;
});

