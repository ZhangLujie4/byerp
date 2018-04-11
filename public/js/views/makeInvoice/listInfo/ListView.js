define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/makeInvoice/listInfo/ListHeader.html',
    'text!templates/stages.html',
    'views/makeInvoice/CreateView',
    'views/makeInvoice/listInfo/ListItemView',
    'views/makeInvoice/EditView',
    'models/makeInvoiceModel',
    'collections/makeInvoice/filterCollection',
    'views/Filter/filterView',
    'common',
    'async',
    'views/selectView/selectView'

], function (
    Backbone,
    $,
    _,
    ListViewBase,
    paginationTemplate,
    listTemplate,
    stagesTamplate,
    CreateView,
    ListItemView,
    EditView,
    CurrentModel,
    ContentCollection,
    FilterView,
    common,
    async,
    SelectView
) {
    var invoiceListView = ListViewBase.extend({


        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'makeInvoice',


        events: {
            'click td:not(:has("input[type="checkbox"]"), :has(.project),.invoiceTax,.sellTax)': 'goToEditDialog',
            'click td.invoiceTax'                                                              : 'goToInvoice',
            'click td.sellTax'                                                                 : 'goToInvoice',
            'click .newSelectList li'                                     : 'chooseOption'
        },
        initialize: function (options) {
            $(document).off('click');

            this.Type = null;


            ListViewBase.prototype.initialize.call(this, options);
        },
        goToEditDialog: function (e) {
            var id;
            var redirectUrl
            e.preventDefault();

            id = $(e.target).closest('tr').data('id');

            model = new CurrentModel({validate: false});

            model.urlRoot = '/makeInvoice/';
            model.fetch({
                data: {id: id, viewType: 'form'},
                success: function (newModel) {

                    new EditView({model: newModel});
                },

                error: function () {
                    App.render({
                        type: 'error',
                        message: 'Please refresh browser'
                    });
                }
            });

        },

        goToInvoice :function (e) {
            var id;
            e.preventDefault();

            id = $(e.target).closest('tr').data('id');

            model = new CurrentModel({validate: false,invoiceTax:true});

            model.urlRoot = '/makeInvoice/';
            model.fetch({
                data: {id: id, viewType: 'form'},
                success: function (newModel) {

                    new EditView({model: newModel,type:'taxSave'});
                },

                error: function () {
                    App.render({
                        type: 'error',
                        message: 'Please refresh browser'
                    });
                }
            });
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

    return invoiceListView;
});

