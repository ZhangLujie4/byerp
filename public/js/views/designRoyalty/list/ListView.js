define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/designRoyalty/list/ListHeader.html',
    'text!templates/stages.html',
    'views/designRoyalty/CreateView',
    'views/designRoyalty/list/ListItemView',
    'models/designRoyaltyModel',
    'collections/taxCategories/filterCollection',
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
        contentType             : 'designRoyalty',


        events: {
            'click  #create'                                             : 'create'

        },
        initialize: function (options) {
            $(document).off('click');

            this.Type = null;
            this.collection = options.collection;
            this.formUrl = 'easyErp/' + this.contentType + '/tform/';
            ListViewBase.prototype.initialize.call(this, options);
        },


        create:function (e) {
            e.preventDefault();
            return new CreateView({});

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

