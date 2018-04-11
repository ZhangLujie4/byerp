define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/oemBarcode/list/ListHeader.html',
    'views/oemBarcode/CreateView',
    'views/oemBarcode/list/ListItemView',
    'views/oemBarcode/EditView',
    'models/OemBarcodeModel',
    'collections/oemBarcode/filterCollection',
    'views/Filter/filterView',
    'dataService',
    'common'
], function (Backbone, $, _, ListViewBase, paginationTemplate, listTemplate, CreateView, ListItemView, EditView, CurrentModel, ContentCollection, FilterView, dataService, common) {
    var OemBarcodeListView = ListViewBase.extend({

        CreateView              : CreateView,
        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'oemBarcode',
        // formUrl                 : "#easyErp/Tasks/form/",

        events: {
            'click .list tbody td:not(.notForm, .validated)'                : 'gotoForm',
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
            
            var id = $(e.target).closest('tr').attr('data-id');
            var redirectUrl = '#easyErp/oemBarcode/list/'+id;
            e.preventDefault();
            Backbone.history.navigate(redirectUrl, {trigger: true});

        },

        pushStages: function (stages) {
            this.stages = stages;
        },

        goodsItem: function () {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            var $checkedInputs;
            var ids = [];
            $checkedInputs = $table.find('input:checked');

            $.each($checkedInputs, function () {
                var $el = $(this);

                ids.push($el.val());
            });
            var result = [];

            ids = _.compact(ids);
            var CreateView = this.CreateView;
            if(ids.length){
                 dataService.getData('oemBarcode/getByWriteOff', {
                    ids : ids
                }, function (response,context) {
                    return new CreateView({orderModels: response});
                },this);
            }
            else{
                return App.render({
                    type   : 'error',
                    message: '请选择要退货的来料产品！'
                });
            }
           
        },

        render: function () {
            var self;
            var $currentEl;
            var itemView;

            $('.ui-dialog ').remove();

            self = this;
            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            });
            //itemView.bind('incomingStages', this.pushStages, this);
            $currentEl.append(itemView.render());

        }

    });

    return OemBarcodeListView;
});
