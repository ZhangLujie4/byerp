define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/aluorderApproval/list/ListHeader.html',
    'text!templates/aluorderApproval/listInfo/ListHeader.html',
    'views/aluorderApproval/CreateView',
    'views/aluorderApproval/list/ListItemView',
    'views/aluorderApproval/EditView',
    'models/AluorderApprovalModel',
    'collections/aluorderApproval/filterCollection',
    'views/Filter/filterView',
    'dataService',
    'common',
    'libs/jquery.freezeheader'
], function (Backbone, $, _, ListViewBase, paginationTemplate, listTemplate, listInfoTemplate, CreateView, ListItemView, EditView, CurrentModel, ContentCollection, FilterView, dataService, common) {
    var AluorderApprovalListView = ListViewBase.extend({

        CreateView              : CreateView,
        listTemplate            : listTemplate,
        listInfoTemplate        : listInfoTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'aluorderApproval',
        // formUrl                 : "#easyErp/Tasks/form/",

        events: {
            //'click .list tbody td:not(.notForm, .validated)'                : 'gotoForm',
        },

        initialize: function (options) {
            $(document).off('click');
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.stages = [];
            this.sort = options.sort;
            this.filter = options.filter;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.page;
            this.contentCollection = ContentCollection;

            ListViewBase.prototype.initialize.call(this, options);
        },

        gotoForm: function (e) {
            
            var id = $(e.target).closest('tr').data('id');
            var type=$(e.target).closest('tr').attr('id');
            e.preventDefault();
            if(type) {
                var itemsNumber = $('#itemsNumber').text();
                this.filter = {};
                if(type=='master') {
                    this.filter.id = id;
                    this.changeLocationHash(1, itemsNumber, this.filter);

                    App.filtersObject.filter = this.filter;
                    var url = window.location.hash;

                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
                }
                else if(type=='detail'){
                    var model = this.collection.get(id);
                    var self = this;
                    e.preventDefault();

                    return new EditView({model : model});
                }

            }

        },

        pushStages: function (stages) {
            this.stages = stages;
        },

        uploadItem: function(){
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            var $checkedInputs;
            var ids = [];
            var answer;
            var edited = this.edited || $thisEl.find('tr.false, #false');

            if (!edited.length) { // ToDo refactor
                this.changed = false;
            }

            if (this.changed) {
                return this.cancelChanges();
            }

            answer = confirm('确定要通过审核吗?!');

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
                        message: '无法审核!'
                    });
                }

                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
        },

        deleteItems: function () {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            var $checkedInputs;
            var ids = [];
            var answer;
            var edited = this.edited || $thisEl.find('tr.false, #false');

            if (!edited.length) { // ToDo refactor
                this.changed = false;
            }

            if (this.changed) {
                return this.cancelChanges();
            }

            answer = confirm('确定要取消审核吗?!');

            if (answer === false) {
                return false;
            }

            $checkedInputs = $table.find('input:checked');

            $.each($checkedInputs, function () {
                var $el = $(this);

                ids.push($el.val());
            });

            ids = _.compact(ids);

            dataService.deleteData(url, {contentType: this.contentType, ids: ids}, function (err, response) {
                if (err) {
                    return App.render({
                        type   : 'error',
                        message: '无法取消!'
                    });
                }

                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
        },

        render: function () {
            var self;
            var $currentEl;
            var itemView;

            $('.ui-dialog ').remove();
            var model=this.collection.toJSON()||[];

            self = this;
            $currentEl = this.$el;
            $currentEl.html('');
            if(model.length > 0 && model[0].lbmc){
                $currentEl.append(_.template(listInfoTemplate, {
                    aluorderApprovalCollection: model,
                    //startNumber    : this.startNumber
                }));
            }
            else{
                $currentEl.append(_.template(listTemplate));
            }
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            });
            //itemView.bind('incomingStages', this.pushStages, this);
            $currentEl.append(itemView.render());
            $('.stripedList').freezeHeader({'height':'640px'});
            // this.renderFilter();
            // this.renderPagination($currentEl, this);

            // $currentEl.append('<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return AluorderApprovalListView;
});
