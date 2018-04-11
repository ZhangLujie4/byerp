define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/stampApplication/list/ListHeader.html',
    'views/stampApplication/CreateView',
    'views/stampApplication/EditView',
    'views/stampApplication/list/ListItemView',
    'models/stampApplicationModel',
    'collections/stampApplication/filterCollection',
    'dataService',
    'constants'
], function ($, _, ListViewBase, listTemplate, CreateView, EditView, ListItemView, CurrentModel, ContentCollection, dataService, CONSTANTS) {
    'use strict';

    var stampApplicationListView = ListViewBase.extend({
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: ContentCollection,
        contentType      : 'stampApplication', // needs in view.prototype.changeLocationHash

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.currentPage;
            this.sort = options.sort;
            this.contentCollection = ContentCollection;
            this.formUrl = 'easyErp/' + this.contentType + '/form/';
            this.render();
        },

        events: {
            'click .checkbox'                                  : 'checked', 
            'click .list tbody td:not(.notForm, .validated)'   : 'goToEditDialog'
        },

        goToEditDialog: function(e){
            var id = $(e.target).closest('tr').data('id');
            var model = this.collection.get(id);
            var isSubmit = $(e.target).closest('tr').find('.isSubmit').data('id');
            var self = this;
            var url = this.formUrl + id;
            e.preventDefault();
            console.log(isSubmit);
            if(!isSubmit){
                console.log(1);
                return new EditView({
                model : model});
            }
            else{
                console.log(2);
                App.ownContentType = true;
                Backbone.history.navigate(url, {trigger: true});
            }
            
        },

        gotoForm: function(e){
            return;
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
            var $affirmButton = $topBar.find('#top-bar-affirmBtn');
            var spesialContentTypes = CONSTANTS.SPECIAL_CONTENT_TYPES;
            var contentType = this.contentType;
            var changedRows;
            var haveNewRow;

            changedRows = this.changedModels ? Object.keys(this.changedModels) : null;
            haveNewRow = $thisEl.find('#false, .false').length;

            if (e) {
                e.stopPropagation();
            }
            var checkboxes = this.$el.find('.checkbox:checked');
            var isSubmit = checkboxes.closest('tr').find('.isSubmit').data('id');

            $checkAll.prop('checked', checkAllBool);
            if($checkBoxes.length == 1){
                if(isSubmit == false){
                    $deleteButton.show();
                    $createButton.hide();
                    $affirmButton.show();
                }
                else if(isSubmit == true)  {
                    $deleteButton.show();
                    $createButton.hide();
                    $affirmButton.hide();
                }
            }
            else if($checkBoxes.length > 1 || (isCheckedAll && !checkAllBool)){
                $deleteButton.show();
                $createButton.hide();
                $affirmButton.hide();
            }
            else{
                $deleteButton.hide();
                $createButton.show();
                $affirmButton.hide();
            }

            if (typeof(this.setAllTotalVals) === 'function') {   // added in case of existing setAllTotalVals in View
                this.setAllTotalVals();
            }
        },

        affirm: function(){
            var checkboxes = this.$el.find('.checkbox:checked');
            var id = checkboxes.attr('data-id');
            dataService.postData('/stampApplication/affirmApprove/' + id, {}, function(response){
                console.log(response);
                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
        },

        render: function () {
            var $currentEl;

            $('.ui-dialog ').remove();

            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());

            this.renderPagination($currentEl, this);

            $('#top-bar-affirmBtn').hide();

            $currentEl.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return stampApplicationListView;
});
