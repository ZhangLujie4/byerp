define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/fileManagement/list/ListHeader.html',
    'views/Filter/filterView',
    'views/fileManagement/CreateView',
    'views/fileManagement/EditView',
    'views/fileManagement/BorrowView',
    'views/fileManagement/borrowAllView',
    'views/fileManagement/ReturnView',
    'views/fileManagement/list/ListItemView',
    'models/CertificateModel',
    'collections/fileManagement/filterCollection',
    'collections/fileManagement/editCollection',
    'dataService',
    'constants',
    'async',
    'moment'
], function (Backbone,
             $,
             _,
             ListViewBase,
             listTemplate,
             FilterView,
             CreateView,
             EditView,
             BorrowView,
             borrowAllView,
             ReturnView,
             ListItemView,
             CurrentModel,
             contentCollection,
             EditCollection,
             dataService,
             CONSTANTS,
             async,
             moment) {
    'use strict';

    var fileManagementListView = ListViewBase.extend({
        page          : null,
        sort          : null,
        listTemplate  : listTemplate,
        ListItemView  : ListItemView,
        contentType   : 'fileManagement', // needs in view.prototype.changeLocationHash
        changedModels : {},
        editCollection: null,
        FilterView    : FilterView,

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

            // this.render();
            ListViewBase.prototype.initialize.call(this, options);
        },

        events: {
            'click .checkbox'      : 'checked',
            'click .oe_sortable'   : 'goSort',
            'click  .list tbody td:not(.notForm, .validated)': 'goToEditDialog',
        },

        checked: function (e) {
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
            var $borrowButton = $topBar.find('#top-bar-borrowBtn');
            var $returnButton = $topBar.find('#top-bar-returnBtn');
            var $borrowAllButton = $topBar.find('#top-bar-borrowAllBtn');
            var $watchAllButton = $topBar.find('#top-bar-watchAllBtn');
            var spesialContentTypes = CONSTANTS.SPECIAL_CONTENT_TYPES;
            var contentType = this.contentType;
            var changedRows;
            var haveNewRow;
            
            changedRows = this.changedModels ? Object.keys(this.changedModels) : null;
            haveNewRow = $thisEl.find('#false, .false').length;

            if (e) {
                e.stopPropagation();
            }

            $checkAll.prop('checked', checkAllBool);
            var checkboxes = this.$el.find('.checkbox:checked');
            var status = checkboxes.closest('tr').find('.status').data('id');

            if($checkBoxes.length == 1){
                $deleteButton.show();
                if(status == 0){
                    $borrowButton.show();
                    $borrowAllButton.hide();
                    $returnButton.hide();
                }
                else if(status == 2){
                    $borrowButton.hide();
                    $borrowAllButton.hide();
                    $returnButton.show();
                }
            }
            else if($checkBoxes.length > 1 || isCheckedAll){
                var a = false;
                checkboxes.each(function(){
                    if($(this).closest('tr').find('.status').data('id') == 0){
                        a = true;
                    }
                    else{
                        a = false;
                        return false;
                    }
                });
                if(a){
                    $deleteButton.show();
                    $borrowButton.hide();
                    $borrowAllButton.show();
                    $returnButton.hide();
                }
                else{
                    $deleteButton.show();
                    $borrowButton.hide();
                    $returnButton.hide();
                }
                
            }
            else {
                $deleteButton.hide();
                $borrowButton.hide();
                $returnButton.hide();
            }

            if (typeof(this.setAllTotalVals) === 'function') {   // added in case of existing setAllTotalVals in View
                this.setAllTotalVals();
            }
        },

        goToEditDialog: function (e) {
            var self = this;
            var modelId = $(e.target).closest('tr').attr('data-id');
            var model = self.collection.get(modelId);

            e.preventDefault();

            dataService.getData('fileManagement/getOneHistory/' + modelId, {}, function(response){
                return new EditView({
                    model       : model,
                    response    : response
                });
            });
        },

        borrowItems: function(){
            var checkboxes = this.$el.find('.checkbox:checked');
            var id = checkboxes.attr('data-id');

            var model = this.collection.get(id);

            return new BorrowView({
                model       : model,
            });
        },

        borrowAll: function(){
            var checkboxes = this.$el.find('.checkbox:checked');
            var dataArray = [];

            checkboxes.each(function () {
                dataArray.push($(this).attr('data-id'));
            });
            return new borrowAllView({
                dataArray:  dataArray,
            });

        },

        returnItems: function(e){
            var checkboxes = this.$el.find('.checkbox:checked');
            var id = checkboxes.attr('data-id');

            var model = this.collection.get(id);

            return new ReturnView({
                model       : model,
            });
        },

        watchAll: function(){
            Backbone.history.navigate('easyErp/certificateHistory', {trigger: true});
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

            $('#top-bar-borrowBtn').hide();
            $('#top-bar-returnBtn').hide();
            $('#top-bar-borrowAllBtn').hide();
        }

    });

    return fileManagementListView;
});
