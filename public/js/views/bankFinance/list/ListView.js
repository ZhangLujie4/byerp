/**
 * Created by admin on 2017/6/26.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Pagination/PaginationTemplate.html',
    'text!templates/bankFinance/list/ListHeader.html',
    'text!templates/stages.html',
    'views/bankFinance/list/ListItemView',
    'views/bankFinance/EditView',
    'models/bankModel',
    'collections/bankFinance/filterCollection',
    'views/Filter/filterView',
    'moment',
    'text!templates/bankFinance/list/summary.html'
], function (
    Backbone,
    $,
    _,
    ListViewBase,
    paginationTemplate,
    listTemplate,
    stagesTamplate,
    ListItemView,
    EditView,
    CurrentModel,
    ContentCollection,
    FilterView,
    moment,
    summaryTemplate
) {
    var TasksListView = ListViewBase.extend({

        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        contentCollection       : ContentCollection,
        filterView              : FilterView,
        hasPagination           : true,
        contentType             : 'accept',


        events: {
            'click td:not(:has("input[type="checkbox"]"),:has(.project))': 'goToEditDialog',
            'click .editable'                                  : 'showNewSelect',
            'click .stageSelectType'                                      : 'showNewSelectType',
            'click .newSelectList li'                                     : 'chooseOption',
            'click  #createBank'                                             : 'createBank',
            'click .newSelectList li:not(.miniStylePagination)': 'changeType'

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

        render: function () {
			
            var $currentEl;
            var itemView;
            var thisday;
            thisday=new(Date);
            var model=this.collection.toJSON();
            var day=[];
            var bankInfo=[];

            for(var i=0;i<model.length;i++){
                var same=0;
                var infoDay=moment(model[i].journal.date).format('YYYY-MM-DD');
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
                for(var n=0;n<model.length;n++){
                    var infoDay=moment(model[n].journal.date).format('YYYY-MM-DD');
                    if(infoDay==day[m]){
                        if(model[n].debit>0){
                            income=income+1;
                        }
                        if(model[n].credit>0){
                            outcome=outcome+1;
                        }
                        credit=credit+model[n].credit;
                        debit=debit+model[n].debit
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
            $currentEl.append(_.template(listTemplate));
            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow,
                toDay:thisday
            });
            $currentEl.append(itemView.render());

            var summary;
            summary = this.$el.find('#summary');
            summary.append(_.template(summaryTemplate, {
                model:bankInfo
            }));
        }
    });

    return TasksListView;
});

