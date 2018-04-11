define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/produceMonitoring/list/ListHeader.html',
    'text!templates/produceMonitoring/listInfo/ListHeader.html',
    'views/produceMonitoring/CreateView',
    'views/produceMonitoring/list/ListItemView',
    'views/produceMonitoring/EditView',
    'models/ProduceMonitoringModel',
    'collections/produceMonitoring/filterCollection',
    'views/Filter/filterView',
    'common',
    'dataService'
], function (Backbone, $, _, ListViewBase, paginationTemplate, listTemplate, listInfoTemplate, CreateView, ListItemView, EditView, CurrentModel, ContentCollection, FilterView, common, dataService) {
    var ProduceMonitoringListView = ListViewBase.extend({

        CreateView              : CreateView,
        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'produceMonitoring',
        // formUrl                 : "#easyErp/Tasks/form/",

        events: {
            'click .barcodeDetail'                : 'goToDetailDialog'
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
            }
        },

        goToDetailDialog: function (e) {

            var dataId = $(e.target).closest('td').data('id');
            var chooseDay = $.trim($(e.target).closest('td').data('day'));
            var self = this;
            e.preventDefault();
            return new EditView({dataId : dataId, chooseDay : chooseDay});

        },

        pushStages: function (stages) {
            this.stages = stages;
        },

        changeDateRange: function () {
            var itemsNumber = $('#itemsNumber').text();
            var stDate = $('#startDate').val();
            var enDate = $('#endDate').val();
            var searchObject;

            this.startDate = new Date(stDate);
            this.endDate = new Date(enDate);

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.date = {
                startDate : this.startDate, 
                endDate : this.endDate
            };

            searchObject = {
                page     : 1,
                startDate: stDate,
                endDate  : enDate,
                filter   : this.filter
            };

            this.collection.getFirstPage(searchObject);
            this.changeLocationHash(1, itemsNumber, this.filter);

            App.filtersObject.filter = this.filter;
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

            if(model.length > 0 && model[0].workCentre){
                $currentEl.append(_.template(listInfoTemplate, {
                workCentreCollection: this.collection.toJSON()
                }));
            }
            else{
                $currentEl.append(_.template(listTemplate));
            }
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());      

        }

    });

    return ProduceMonitoringListView;
});
