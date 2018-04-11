define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/costApportionment/list/ListHeader.html',
    'text!templates/stages.html',
    'views/costApportionment/list/ListItemView',
    'models/costApportionmentModel',
    'collections/costApportionment/filterCollection',
    'views/Filter/filterView',
    'common',
    'async',
    'views/costApportionment/EditView'

], function (
    Backbone,
    $,
    _,
    ListViewBase,
    paginationTemplate,
    listTemplate,
    stagesTamplate,
    ListItemView,
    CurrentModel,
    ContentCollection,
    FilterView,
    common,
    async,
    EditView
) {
    var costApportionmentListView = ListViewBase.extend({

        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'costApportionment',


        events: {
            'click td.metalPlateOutput'                                                              : 'getDetail',
            'click td.sprayOutput'                                                                   : 'getDetail',
            'click td.rawMaterialCosting'                                                            : 'getDetail',
            'click td.processingCost'                                                                : 'getDetail',
            'click td.publicTotal'                                                                   : 'getDetail',
            'click td.shippingCost'                                                                  : 'getDetail',
            'click td.sales'                                                                         : 'getDetail'
        },
        initialize: function (options) {
            $(document).off('click');

            this.Type = null;


            ListViewBase.prototype.initialize.call(this, options);
        },

        getDetail:function (e) {
            var id;
            var type;
            e.preventDefault();
            type=$(e.target).data('id');
            id = $(e.target).closest('tr').data('id');
            var collection=this.collection.get(id);

            new EditView({model : collection,type:type});


        },

        changeDateRange: function () {
            var itemsNumber = $('#itemsNumber').text();
            var stDate = $('#startDate').val();
            var enDate = $('#endDate').val();
            //var buildingId=$('#buildingId').attr('data-id');
            var searchObject;

            this.startDate = new Date(stDate);
            this.endDate = new Date(enDate);

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.date = {
                value: [this.startDate, this.endDate]
            };
            //this.filter.id=buildingId;

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
            var $currentEl;
            var itemView;


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
        }
    });

    return costApportionmentListView;
});

