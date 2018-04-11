define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/DesignBook/list/ListHeader.html',
    'text!templates/stages.html',
    'views/DesignBook/list/ListItemView',
    'collections/DesignBook/filterCollection',
    'dataService',
    'models/DesignProjectsModel'
], function ($, _, ListViewBase, listTemplate, stagesTamplate, ListItemView, ContentCollection,dataService,DesignProjectsModel) {
    var ProjectsListView = ListViewBase.extend({
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        ContentCollection: ContentCollection,
        formUrl          : '#easyErp/DesignBook/form/',
        contentType      : 'DesignBook',


        events: {
            'click  td.notForm'                                        : 'gotoProjectForm'

        },

        initialize: function (options) {
            $(document).off('click');

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.ContentCollection = ContentCollection;
            this.render();
        },



        gotoProjectForm:function (e) {
            var id;
            var type;
            var name;
            e.preventDefault();
            var formUrl='#easyErp/DesignProjects/form/';
            id = $(e.target).closest('tr').data('id');
            type=$(e.target).closest('tr').data('type');
            name=$(e.target).closest('tr').data('name');
            var self=this;

            dataService.getData('/DesignBook/getProject',{id:id},function (result) {
                if(result.projectId.length==1) {
                    var projectId = result.projectId[0]._id;
                    Backbone.history.navigate(formUrl + projectId, {trigger: true});
                }else{
                    new DesignProjectsModel().save({
                        DesignBookNumber:id,
                        designContractType:type,
                        name:name
                    }, {
                        headers: {
                            mid: 39
                        },
                        wait   : true,
                        success: function (model) {
                            App.render({
                                type   : 'notify',
                                message: '已生成设计合同，请再次点击查看！'
                            });
                        },

                        error: function (model, xhr) {
                            self.errorNotification(xhr);
                        }
                    });
                }
            })
        },

        render: function () {
            var itemView;
            var $currentEl;

            $('.ui-dialog ').remove();
            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            });

            $currentEl.append(itemView.render());

            this.renderPagination($currentEl, this);

            $currentEl.append('<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>');
        }

    });

    return ProjectsListView;
});
