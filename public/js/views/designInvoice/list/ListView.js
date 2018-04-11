define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/designInvoice/list/ListHeader.html',
    'text!templates/stages.html',
    'views/designInvoice/CreateView',
    'views/designInvoice/list/ListItemView',
    'views/designInvoice/EditView',
    'models/designInvoiceModel',
    'collections/designInvoice/filterCollection',
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
    var TasksListView = ListViewBase.extend({

        CreateView              : CreateView,
        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'designInvoice',


        events: {
            'click td:not(:has("input[type="checkbox"]"), :has(.project))': 'goToEditDialog'
        },
        initialize: function (options) {
            $(document).off('click');

            this.Type = null;


            ListViewBase.prototype.initialize.call(this, options);
        },
        goToEditDialog: function (e) {
            var id;

            e.preventDefault();

            id = $(e.target).closest('tr').data('id');

            model = new CurrentModel({validate: false});

            model.urlRoot = '/designInvoice/';
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

    return TasksListView;
});

