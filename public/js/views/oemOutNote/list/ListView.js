define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/oemOutNote/list/ListHeader.html',
    'views/oemOutNote/list/ListItemView',
    'views/oemOutNote/EditView',
    'constants',
    'populate',
    'moment',
    'custom'
], function (Backbone, $, _, ListViewBase, listTemplate, ListItemView, EditView, CONSTANTS, populate, moment, custom) {
    var workPointListView = ListViewBase.extend({
        listTemplate: listTemplate,
        ListItemView: ListItemView,
        EditView    : EditView,
        contentType : CONSTANTS.OEMOUTNOTE,
        formUrl     : '#easyErp/oemOutNote/form/',

        initialize: function (options) {
            var dateRange;
            this.collection = options.collection;
            this.startTime = options.startTime;
            this.endTime = options.endTime;
            dateRange = custom.retriveFromCash('oemOutNoteDateRange');
            this.filter = options.filter || custom.retriveFromCash('oemOutNote.filter');
            if (!this.filter) {
                this.filter = {};
            }
            if (!this.filter.startDate) {
                this.filter.startDate = {
                    key  : 'startDate',
                    type : 'date',
                    value: new Date(dateRange.startDate)
                };
                this.filter.endDate = {
                    key  : 'endDate',
                    type : 'date',
                    value: new Date(dateRange.endDate)
                };
            }

            options.filter = this.filter;

            this.startDate = new Date(this.filter.startDate.value);
            this.endDate = new Date(this.filter.endDate.value);

            options.startDate = this.startDate;
            options.endDate = this.endDate;
            ListViewBase.prototype.initialize.call(this, options);
            custom.cacheToApp('oemOutNote.filter', this.filter);
        },

        events: {
            'click .list tbody td:not(.notForm, .checkbox)': 'gotoForm'
        },

        gotoForm: function (e) {
            var id;
            if (!this.formUrl) {
                return;
            }
            App.ownContentType = true;
            id = $(e.target).closest('tr').attr('data-id');
            var url = this.formUrl + id;
            Backbone.history.navigate(url, {trigger: true});
        },

        changeDateRange: function () {
            var stDate = $('#startDate').val();
            var edDate = $('#endDate').val();
            var searchObject;

            this.startDate = new Date(stDate);
            this.endDate = new Date(edDate);

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.startDate = {
                key  : 'startDate',
                type: 'date',
                value: stDate
            };

            this.filter.endDate = {
                key  : 'endDate',
                type: 'date',
                value: edDate
            };

            this.startKey = moment(this.startDate).year() * 100 + moment(this.startDate).month();
            this.endKey = moment(this.endDate).year() * 100 + moment(this.endDate).month();

            searchObject = {
                page: 1,
                filter   : this.filter
            };

            this.collection.showMore(searchObject);

            App.filtersObject.filter = this.filter;
                  
            custom.cacheToApp('oemOutNote.filter', this.filter);
        },

        checked: function (e) {
            var $thisEl = this.$el;
            var $topBar = $('#top-bar');
            var $checkBoxes = $thisEl.find('.checkbox:checked:not(#checkAll,notRemovable,.productCategory)');
            var notRemovable = $thisEl.find('.notRemovable');
            var $checkAll = $thisEl.find('#checkAll');
            var $currentChecked = e ? $(e.target) : $thisEl.find('#checkAll');
            var isCheckedAll = $currentChecked.attr('id') === 'checkAll';
            var checkAllBool = (($checkBoxes.length + notRemovable.length) === this.collection.length);
            var $deleteButton = $topBar.find('#top-bar-deleteBtn');
            var $createButton = $topBar.find('#top-bar-createBtn');
            var $copyButton = $topBar.find('#top-bar-copyBtn');
            var $saveButton = $topBar.find('#top-bar-saveBtn');
            var $editButton = $topBar.find('#top-bar-editBtn');
            var spesialContentTypes = CONSTANTS.SPECIAL_CONTENT_TYPES;
            var contentType = this.contentType;
            var changedRows;
            var haveNewRow;
            var action = App.publishProductState;

            changedRows = this.changedModels ? Object.keys(this.changedModels) : null;
            haveNewRow = $thisEl.find('#false, .false').length;

            if (e) {
                e.stopPropagation();
            }

            $checkAll.prop('checked', checkAllBool);

            if ((!isCheckedAll && $checkBoxes.length) || (isCheckedAll && !checkAllBool)) {
                $deleteButton.show();
                $copyButton.show();
                $createButton.hide();
                $editButton.show();
            } else {
                $editButton.hide();
                $deleteButton.hide();
            }

        },

        editItem: function () {
            var id = $('#listTable input:checked');
            if(id.length > 1){
                return App.render({                     
                    type   : 'error',
                    message: '请选择一个进行编辑!'
               })
            }
            if(id.length == 1){
                var noteId = id.data('id');
                var status = id.data('status');
                if(status == 'Done'){
                    return App.render({                     
                        type   : 'error',
                        message: '该发货单已确认，不能进行编辑!'
                   })
                }
                var model = this.collection.get(noteId);
                var EditView = this.EditView || Backbone.View.extend({});

                return new EditView({model: model});
            }
            
           
        },

        render: function () {
            var $currentEl;

            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate)({}));

            $currentEl.append(new ListItemView({
                collection: this.collection,
            }).render());
            this.renderPagination($currentEl, this);
            $('#top-bar-saveBtn').hide();
            $('#top-bar-copy').hide();
            $('#top-bar-confirmBtn').hide();
            $('#top-bar-editBtn').hide();
            return this;
        }
    });

    return workPointListView;
});
