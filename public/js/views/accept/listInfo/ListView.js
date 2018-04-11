define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/accept/list/ListHeader.html',
    'text!templates/stages.html',
    'views/accept/CreateView',
    'views/accept/list/ListItemView',
    'views/accept/EditView',
    'models/acceptModel',
    'collections/accept/filterCollection',
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
        contentType             : 'accept',


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

            model.urlRoot = '/Accept/';
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
            var thisday;
            thisday=new(Date);

            $('.ui-dialog ').remove();

            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow,
                toDay:thisday
            });
            $currentEl.append(itemView.render());
        }
    });

    return TasksListView;
});

