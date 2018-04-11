/**
 * Created by admin on 2017/6/26.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/bankInfo/list/ListHeader.html',
    'text!templates/stages.html',
    'views/bankInfo/CreateBank',
    'views/bankInfo/list/ListItemView',
    'views/bankInfo/bankEditView',
    'models/bankModel',
    'collections/bankInfo/filterCollection',
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
            'click td:not(:has("input[type="checkbox"]"), #operate,:has(.project))': 'goToEditDialog',
            'click .editable'                                  : 'showNewSelect',
            'click .stageSelectType'                                      : 'showNewSelectType',
            'click .newSelectList li'                                     : 'chooseOption',
            'click  #createBank'                                             : 'createBank',
            'click .newSelectList li:not(.miniStylePagination)': 'changeType',
            'click td#operate': 'goToEdit'


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

            redirectUrl = '#easyErp/bankInfo/list/'+id;

            Backbone.history.navigate(redirectUrl, {trigger: true});



        },

        goToEdit: function (e) {
            var id;

            e.preventDefault();

            id = $(e.target).closest('tr').data('id');

            model = new CurrentModel({validate: false});

            model.urlRoot = '/bankInfo/';
            model.fetch({
                data: {id: id, viewType: 'forms'},
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

        createBank:function (e) {
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

