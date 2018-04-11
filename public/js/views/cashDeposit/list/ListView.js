
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/cashDeposit/list/ListHeader.html',
    'text!templates/stages.html',
    'views/cashDeposit/CreateView',
    'views/cashDeposit/list/ListItemView',
    'views/cashDeposit/EditView',
    'models/cashDepositModel',
    'collections/cashDeposit/filterCollection',
    'views/Filter/filterView',
    'common',
    'async',
    'views/selectView/selectView',
    'dataService',
    'constants',
    'moment',
    'text!templates/cashDeposit/listInfo/ListHeader1.html',
    'text!templates/cashDeposit/listInfo/ListHeader2.html'
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
    SelectView,
    dataService,
    CONSTANTS,
    moment,
    ListHeaderType1,
    ListHeaderType2
) {
    var cashDepositListView = ListViewBase.extend({

        CreateView              : CreateView,
        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'cashDeposit',
        ListHeaderType1         :ListHeaderType1,
        ListHeaderType2         :ListHeaderType2,

        events: {
            'click .newSelectList li'                                     : 'chooseOption',
            'click td:not(:has(.noteDetail))'                             : 'goToEditDialog'
        },
        initialize: function (options) {
            $(document).off('click');

            this.cashDepositType = options.collection.cashDepositType;

            ListViewBase.prototype.initialize.call(this, options);
        },

        changeDateRange:function () {
            var type ;
            type = $('#cashDepositType').attr('data-id');
            var itemsNumber = $('#itemsNumber').text();
            if (!this.filter) {
                this.filter = {};
            }
            this.filter.type=type;

            this.changeLocationHash(1, itemsNumber, this.filter);

            App.filtersObject.filter = this.filter;

            var url = window.location.hash;

            Backbone.history.fragment = '';

            Backbone.history.navigate(url, {trigger: true});

        },

        goToEditDialog: function (e) {
            var id;

            e.preventDefault();

            id = $(e.target).closest('tr').data('id');

            var model = new CurrentModel({validate: false});

            model.urlRoot = '/cashDeposit/';
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

            var template;

            $('.ui-dialog ').remove();

            if(!this.cashDepositType){
                template=listTemplate;
            }else if(this.cashDepositType=='tender'||this.cashDepositType=='salary'||this.cashDepositType=='deposit'||this.cashDepositType=='reputation'){
                template=ListHeaderType1;
            }else{
                template=ListHeaderType2;
            }

            $currentEl = this.$el;
            $currentEl.html('');
            $currentEl.append(_.template(template));
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow,
                cashDepositType:this.cashDepositType
            });
            $currentEl.append(itemView.render());
        }
    });

    return cashDepositListView;
});

