define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/aluveneerOrders/list/ListHeader.html',
    'text!templates/aluveneerOrders/listInfo/ListHeader.html',
    'text!templates/aluveneerOrders/list/buildingsEdit.html',
    'text!templates/aluveneerOrders/list/buildingsCol.html',
    'views/aluveneerOrders/CreateView',
    'views/aluveneerOrders/list/ListItemView',
    'views/aluveneerOrders/EditView',
    'views/aluveneerOrders/UploadView',
    'models/AluveneerOrdersModel',
    'collections/aluveneerOrders/filterCollection',
    'views/Filter/filterView',
    'dataService',
    'common',
    'libs/jquery.freezeheader'
], function (Backbone, $, _, ListViewBase, paginationTemplate, listTemplate, listInfoTemplate, buildingsEdit, buildingsColEdit, CreateView, ListItemView, EditView, UploadView, CurrentModel, ContentCollection, FilterView, dataService, common) {
    var AluveneerOrdersListView = ListViewBase.extend({

        CreateView              : CreateView,
        listTemplate            : listTemplate,
        listInfoTemplate        : listInfoTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'aluveneerOrders',
        formUrl                 : "#easyErp/aluveneerOrders/",

        events: {
            //'click .list tbody td:not(.notForm, .validated)'                : 'gotoForm'
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
            var model=this.collection.toJSON();
            var listUrl = model[0].projectName._id + '-' + model[0].cgdh;
            return new UploadView({listUrl : listUrl});
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
                aluveneerOrdersCollection: model,
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
        }

    });

    return AluveneerOrdersListView;
});
