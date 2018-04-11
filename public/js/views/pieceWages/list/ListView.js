define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/pieceWages/list/ListHeader.html',
    'text!templates/pieceWages/empList/ListHeader.html',
    'text!templates/pieceWages/barList/ListHeader.html',
    'views/pieceWages/list/ListItemView',
    'models/PieceWagesModel',
    'collections/pieceWages/filterCollection',
    'views/Filter/filterView',
    'common',
    'custom',
    'dataService',
    'moment'
], function (Backbone, $, _, ListViewBase, paginationTemplate, listTemplate, empListTemplate, barListTemplate, ListItemView, CurrentModel, ContentCollection, FilterView, common, custom, dataService, moment) {
    var PieceWagesListView = ListViewBase.extend({

        // CreateView              : CreateView,
        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        //hasPagination           : true,
        contentType             : 'pieceWages',
        formUrl                 : '#easyErp/pieceWages/',

        events: {
            'click .list tbody td:not(.notForm, .validated)'                : 'gotoForm',
            //'click .stageSelect'                                          : 'showNewSelect',
            //'click .stageSelectType'                                      : 'showNewSelectType',
            //'click .newSelectList li'                                     : 'chooseOption'
        },

        initialize: function (options) {
            $(document).off('click');
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.stages = [];
            this.sort = options.sort;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.page;
            this.contentCollection = ContentCollection;
            var dateRange = custom.retriveFromCash('pieceWagesDateRange');

            this.filter = options.filter || {};
            if (!this.filter) {
                this.filter = {};
            }
            if (!this.filter.startDate) {
                this.filter.startDate = {
                    key  : 'startDate',
                    type : 'date',
                    value: new Date(dateRange.startDate)
                };
            }
            options.filter = this.filter;

            this.startDate = new Date(this.filter.startDate.value);

            options.startDate = this.startDate;

            ListViewBase.prototype.initialize.call(this, options);
            custom.cacheToApp('pieceWages.filter', this.filter);
        },


        // goToEditDialog: function (e) {

        //     var id = $(e.target).closest('tr').data('id');
        //     var url = formUrl + '/'+ id;
        //     var self = this;
        //     e.preventDefault();

        //     return new EditView({model : model});

        // },
        gotoForm: function (e) {
            var id;
            var type;

            if (!this.formUrl) {
                return;
            }
            App.ownContentType = true;
            id = $(e.target).closest('tr').attr('data-id');
            type = $(e.target).closest('tr').attr('data-type');
            if(this.filter.departId){
                delete this.filter.departId;
            }
            if(this.filter.empId){
                delete this.filter.empId;
            }
            if(type){
                var itemsNumber = $('#itemsNumber').text();
                if(type == 'departList'){
                    this.filter.departId = id;
                }
                else if(type == 'empList'){
                    this.filter.empId = id;
                }

                this.changeLocationHash(1, itemsNumber, this.filter);
                App.filtersObject.filter = this.filter;
                var url = window.location.hash;
                Backbone.history.fragment = '';
                Backbone.history.navigate(url, {trigger: true});
            }
            // var datekey = $(e.target).closest('tr').find('.datekey').text();
            // datekey = datekey.toString();
            // window.location.hash = this.formUrl + 'form/' + datekey + id;

        },

        pushStages: function (stages) {
            this.stages = stages;
        },

        generate: function(){
            var div_print=document.getElementById("pieceWages");
            var div_print2=document.getElementById("salary-head");
            var newstr = div_print.innerHTML; 
            var newstr2 = div_print2.innerHTML;
            var oldstr = document.body.innerHTML; 
            document.body.innerHTML = newstr2+newstr; 
            window.print(); 
            document.body.innerHTML = oldstr; 
            Backbone.history.fragment = '';
            Backbone.history.navigate(window.location.hash, {trigger: true});
            return false; 
        },

        changeDateRange: function () {
            var stDate = $('#startDate').val();
            var searchObject;
            var itemsNumber = $('#itemsNumber').text();

            this.startDate = new Date(stDate);

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.startDate = {
                key  : 'startDate',
                type: 'date',
                value: stDate
            };

            this.startKey = moment(this.startDate).year() * 100 + moment(this.startDate).month();

            searchObject = {
                page: 1,
                startDate: stDate,
                filter   : this.filter
            };

            this.collection.showMore(searchObject);
            this.changeLocationHash(1, itemsNumber, this.filter);
            App.filtersObject.filter = this.filter;

            custom.cacheToApp('pieceWages.filter', this.filter);
        },

        getMinDate: function (context) {
            dataService.getData('/employees/getYears', {}, function (response) {
                var minDate = new Date(response.min);

                $('#startDate').datepicker('option', 'minDate', minDate);
            }, context);
        },

        render: function () {
            var self;
            var $currentEl;
            var itemView;
            this.startKey = moment(this.startDate).year() * 100 + moment(this.startDate).month()+1;
            var model = this.collection.toJSON() || [];
            var type = model[0] || {};
            $('.ui-dialog ').remove();

            self = this;
            $currentEl = this.$el;

            $currentEl.html('');
            if(type.barCode){
                $currentEl.append(_.template(barListTemplate));
            }
            else if(type.price){
                $currentEl.append(_.template(empListTemplate));
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

            App.filtersObject.filter = this.filter;

            // this.renderFilter();
            this.renderPagination($currentEl, this);
            return this;
        }

    });

    return PieceWagesListView;
});
