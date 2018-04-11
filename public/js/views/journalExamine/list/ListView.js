define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'views/selectView/selectView',
    'text!templates/journal/list/cancelEdit.html',
    'text!templates/journalExamine/list/ListHeader.html',
    'views/journalExamine/list/ListItemView',
    'models/JournalModel',
    'collections/journalExamine/filterCollection',
    'dataService',
    'async',
    'constants'
], function ($, _, listViewBase, SelectView, cancelEdit, listHeaderTemplate,  ListItemView,  CurrentModel, contentCollection, dataService, async,CONSTANTS) {
    'use strict';

    var ListView = listViewBase.extend({

        ListItemView     : ListItemView,
        CurrentModel     : CurrentModel,

        contentCollection: contentCollection,
        contentType      : 'journal',
        changedModels    : {},
        responseObj      : {},
        cancelEdit       : cancelEdit,

        initialize: function (options) {
            $(document).off('click');

            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.contentCollection = contentCollection;

            this.render();
        },

        events: {
            'click td#post': 'goToPass'
        },

        goToPass:function (e) {
            var id;
            var post;
            var debitAccount;
            var creditAccount;
            e.preventDefault();
            id = $(e.target).closest('tr').data('id');
            post=$(e.target).closest('td').attr('data-name');
            var targetEl=$(e.target).closest('tr');
            debitAccount=targetEl.find('#debitAccount').text();
            creditAccount=targetEl.find('#creditAccount').text();


            if(post=='canPost'){
                if(debitAccount.indexOf('库存现金')>0 ||  creditAccount.indexOf('库存现金')>0 ){
                    dataService.postData(CONSTANTS.URLS.CASHJOURNAL_CREATEJOURNAL,{
                        _id:id
                    },function (response) {
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(window.location.hash, {trigger: true});
                    })
                }
                if(debitAccount.indexOf('银行')>0 ||  creditAccount.indexOf('银行')>0 || debitAccount.indexOf('结算中心')>0 ||  creditAccount.indexOf('结算中心')>0 ){
                    dataService.postData(CONSTANTS.URLS.BANKINFO_CREATEBANKBOOK,{
                        _id:id
                    },function (response) {
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(window.location.hash, {trigger: true});
                    })
                }

            }
        },

        render: function () {
            var $currentEl;
            var itemView;

            $('.ui-dialog ').remove();

            $('#top-bar-deleteBtn').hide();

            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.html(_.template(listHeaderTemplate));

            this.hideSaveCancelBtns();

            itemView = new ListItemView({
                collection : this.collection,
                itemsNumber: this.collection.namberToShow
            });

            $currentEl.append(itemView.render());

            this.renderPagination($currentEl, this);







        }

    });

    return ListView;
});
