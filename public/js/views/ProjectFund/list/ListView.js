define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/ProjectFund/list/ListHeader.html',
    'text!templates/stages.html',
    'views/ProjectFund/list/ListItemView',
    'collections/ProjectFund/filterCollection',
    'views/Filter/filterView',
    'common',
    'async',
    'text!templates/ProjectFund/PmrDetailList/ListHeader.html',
    'text!templates/ProjectFund/projectDetailList/ListHeader.html'
], function (
    Backbone,
    $,
    _,
    ListViewBase,
    paginationTemplate,
    listTemplate,
    stagesTamplate,
    ListItemView,
    ContentCollection,
    FilterView,
    common,
    async,
    PmrListTemplate,
    ProjectListTemplate
) {
    var ProjectFundListView = ListViewBase.extend({

        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'ProjectFund',
        pmrListTemplate         : PmrListTemplate,
        ProjectListTemplate     : ProjectListTemplate,


        events: {
            'click td'                                                        : 'goToEditDialog'
        },
        initialize: function (options) {
            $(document).off('click');

            this.Type = null;


            ListViewBase.prototype.initialize.call(this, options);
        },

        goToEditDialog:function (e) {

            var id;
            var type;
            e.preventDefault();

            id = $(e.target).closest('tr').data('id');
            type=$(e.target).closest('tr').attr('id');
            if(type) {
                var itemsNumber = $('#itemsNumber').text();
                //var searchObject;

                this.filter = {};
                if(type=='pmrList') {
                    this.filter.pmrId = id;
                }else if(type=='projectList'){
                    this.filter.projectId = id;
                }
                /*searchObject = {
                    page: 1,
                    filter: this.filter
                };
                //this.collection.getFirstPage(searchObject);*/
                this.changeLocationHash(1, itemsNumber, this.filter);

                App.filtersObject.filter = this.filter;

                var url = window.location.hash;

                Backbone.history.fragment = '';

                Backbone.history.navigate(url, {trigger: true});
            }
        },

        changeDateRange:function () {
            var type ;
            type = $('#projectType').attr('data-id');
            var itemsNumber = $('#itemsNumber').text();
            var searchObject;
            if (!this.filter) {
                this.filter = {};
            }
            this.filter.type=type;
            searchObject = {
                page     : 1,
                filter   : this.filter
            };

            this.collection.getFirstPage(searchObject);
            this.changeLocationHash(1, itemsNumber, this.filter);

            App.filtersObject.filter = this.filter;

        },

        render: function () {
            var $currentEl;
            var itemView;
            $('.ui-dialog ').remove();

            var model=this.collection.toJSON()||[];

            $currentEl = this.$el;
            $currentEl.html('');
            if(model[0].project) {
                var pmr=model[0].project.pmr;

                $currentEl.append(_.template(PmrListTemplate,{pmr:pmr}));
            }else if(model[0].invoice){
                var pro=model[0].pro;
                $currentEl.append(_.template(ProjectListTemplate,{pro:pro}));
            }else{
                $currentEl.append(_.template(listTemplate));
            }

            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow

            });
            $currentEl.append(itemView.render());
        }
    });

    return ProjectFundListView;
});

