define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/borrowAffirm/list/ListHeader.html',
    'views/borrowAffirm/list/ListItemView',
    'models/CertificateModel',
    'collections/borrowAffirm/filterCollection',
    'dataService',
    'constants',
    'async',
    'moment'
], function (Backbone,
             $,
             _,
             ListViewBase,
             listTemplate,
             ListItemView,
             CurrentModel,
             contentCollection,
             dataService,
             CONSTANTS,
             async,
             moment) {
    'use strict';

    var borrowAffirmListView = ListViewBase.extend({
        page          : null,
        sort          : null,
        listTemplate  : listTemplate,
        ListItemView  : ListItemView,
        contentType   : 'borrowAffirm', // needs in view.prototype.changeLocationHash
        changedModels : {},
        editCollection: null,

        initialize: function (options) {
            $(document).off('click');

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
        },


        affirm: function(){
            var self = this;
            var checkboxes = this.$el.find('.checkbox:checked');
            var dataArray = [];

            App.startPreload();

            checkboxes.each(function () {
                dataArray.push($(this).attr('data-id'));
            });
            console.log(dataArray);
            dataService.patchData('/borrowAffirm/affirm', {dataArray: dataArray}, function () {
                App.stopPreload();

                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true, replace: true});
            });
        },
        
        editItem: function(){
            var self = this;
            var checkboxes = this.$el.find('.checkbox:checked');
            var dataArray = [];

            App.startPreload();

            checkboxes.each(function () {
                dataArray.push($(this).attr('data-id'));
            });
            console.log(dataArray);
            dataService.patchData('/borrowAffirm/disagree', {dataArray: dataArray}, function () {
                App.stopPreload();

                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true, replace: true});
            });
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
            var $affirmButton = $topBar.find('#top-bar-affirmBtn');
            var $disagreeButton = $topBar.find('#top-bar-editBtn');

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

            if($checkBoxes.length >= 1 || isCheckedAll){
                $affirmButton.show();
                $disagreeButton.show();
            }

            else {
                $affirmButton.hide();
                $disagreeButton.hide();
            }

            if (typeof(this.setAllTotalVals) === 'function') {   // added in case of existing setAllTotalVals in View
                this.setAllTotalVals();
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
                itemsNumber: this.collection.namberToShow,
            }).render()); // added two parameters page and items number

            $('#top-bar-affirmBtn').hide();

            this.renderPagination($currentEl, this);
    
        }

    });

    return borrowAffirmListView;
});
