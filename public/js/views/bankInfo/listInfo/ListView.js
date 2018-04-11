/**
 * Created by admin on 2017/6/26.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/bankInfo/listInfo/ListHeader.html',
    'text!templates/stages.html',
    'views/bankInfo/CreateBankInfo',
    'views/bankInfo/listInfo/ListItemView',
    'views/bankInfo/EditView',
    'models/bankInfoModel',
    'collections/bankInfo/filterCollection',
    'views/Filter/filterView',
    'common',
    'async',
    'views/selectView/selectView',
    'moment',
    'text!templates/bankInfo/list/summary.html'
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
    moment,
    summaryTemplate
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
            'click td:not(:has("input[type="checkbox"]"), :has(.project))': 'goToEditDialog',
            'click .editable'                                             : 'showNewSelect',
            'click .stageSelectType'                                      : 'showNewSelectType',
            'click .newSelectList li'                                     : 'chooseOption',
            'click  #createBankInfo'                                             : 'createBankInfo',
            'click .newSelectList li:not(.miniStylePagination)': 'changeType'


        },
        initialize: function (options) {
            $(document).off('click');

            this.Type = null;
            this.bankId=options.collection.id;
            console.log(this.collection)

            ListViewBase.prototype.initialize.call(this, options);
        },
        goToEditDialog: function (e) {
            var id;

            e.preventDefault();

            id = $(e.target).closest('tr').data('id');

            model = new CurrentModel({validate: false});

            model.urlRoot = '/bankInfo/';
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

        createBankInfo:function (e) {
            var model=this.collection.toJSON();
            var accountId=model[0].bank[0].bankAccount;
            e.preventDefault();
            return new CreateView({
                bankId:accountId
            });

        },

        render: function () {
            var $currentEl;
            var itemView;
            var thisday;
            var model;
            var models;
            var mdoelBank;
            var summary;
            var bankInfo=[];
            var day=[];


            model=this.collection.toJSON();
            models=model[0].bank[0];
            mdoelBank=model[0].bankInfo;
            thisday=new(Date);

            for(var i=0;i<mdoelBank.length;i++){
                var same=0;
                var infoDay=moment(mdoelBank[i].journal.date).format('YYYY-MM-DD');
                for(var j=0;j<day.length;j++){
                    if(day[j]==infoDay){
                        same=1;
                    }
                }
                if(same==0)
                {
                    day.push(infoDay)
                }
            }
            for(var m=0;m<day.length;m++){
                var items={};
                var income=0;
                var outcome=0;
                var credit=0;
                var debit=0;
                var note='';
                for(var n=0;n<mdoelBank.length;n++){
                    var infoDay=moment(mdoelBank[n].journal.date).format('YYYY-MM-DD');
                    if(infoDay==day[m]){
                        if(mdoelBank[n].debit>0){
                            income=income+1;
                        }
                        if(mdoelBank[n].credit>0){
                            outcome=outcome+1;
                        }
                        credit=credit+mdoelBank[n].credit;
                        debit=debit+mdoelBank[n].debit
                    }
                }
                note='收入'+income+'条，支出'+outcome+'条。'
                items={
                    date:day[m],
                    credit:credit,
                    debit:debit,
                    note:note
                };
                bankInfo.push(items)
            }



            $('.ui-dialog ').remove();

            $currentEl = this.$el;
            $currentEl.html('');
            $currentEl.append(_.template(listTemplate,{
                name:models.name
            }));
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow,
                toDay:thisday
            });
            $currentEl.append(itemView.render());
            console.log(models.name)
            summary = this.$el.find('#summary');
            summary.append(_.template(summaryTemplate, {
                model:bankInfo,
                name:models.name
            }));
        }
    });

    return TasksListView;
});

