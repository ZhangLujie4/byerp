define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/shippingPlan/list/ListHeader.html',
    'views/shippingPlan/list/ListItemView',
    'views/shippingPlan/CreateView',
    'collections/shippingPlan/filterCollection',
    'models/shippingPlanModel',
    'dataService',
    'populate',
    'async',
    'helpers',
    'custom',
    'moment'
], function (Backbone, $, _, ListViewBase, listTemplate, ListItemView, CreateView, paymentCollection, CurrentModel, dataService, populate, async, helpers, custom, moment) {
    'use strict';

    var PaymentListView = ListViewBase.extend({
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentType      : 'shippingPlan', // needs in view.prototype.changeLocationHash
        modelId          : null,
        $listTable       : null,
        editCollection   : null,
        contentCollection: paymentCollection,
        changedModels    : {},
        responseObj      : {},
        template         : _.template(listTemplate),
        hasPagination    : true,

        events: {
            'change .editable '                                : 'setEditable',
            'click .newSelectList li:not(.miniStylePagination)': 'chooseOption'
        },

        initialize: function (options) {
            $(document).off('click');
            var dateRange;
            this.CurrentModel = CurrentModel;

            this.startTime = options.startTime;
            this.endTime = options.endTime;
            dateRange = custom.retriveFromCash('shippingPlanDateRange');
            this.filter = options.filter || custom.retriveFromCash('shippingPlan.filter');
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.formUrl = 'easyErp/' + this.contentType + '/tform/';
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.contentCollection = paymentCollection;
            if (!this.filter) {
                this.filter = {};
            }
            if (!this.filter.startDate) {
                this.filter.startDate = {
                    key  : 'startDate',
                    type : 'date',
                    value: new Date(dateRange.startDate)
                };
                this.filter.endDate = {
                    key  : 'endDate',
                    type : 'date',
                    value: new Date(dateRange.endDate)
                };
            }
            options.filter = this.filter;

            this.startDate = new Date(this.filter.startDate.value);
            this.endDate = new Date(this.filter.endDate.value);

            options.startDate = this.startDate;
            options.endDate = this.endDate;

            this.forSale = options.forSale;
            ListViewBase.prototype.initialize.call(this, options);
            custom.cacheToApp('shippingPlan.filter', this.filter);
        },

        deleteItems: function () {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            var $checkedInputs;
            var ids = [];
            var answer;
            var edited = this.edited || $thisEl.find('tr.false, #false');

            if (!edited.length) { // ToDo refactor
                this.changed = false;
            }

            if (this.changed) {
                return this.cancelChanges();
            }

            answer = confirm('确定要删除记录吗?!');

            if (answer === false) {
                return false;
            }

            $checkedInputs = $table.find('input:checked');
            var flag = false;
            $.each($checkedInputs, function () {
                var $el = $(this);
                if(!$el.attr('data-status')){
                    flag = true;
                }
                ids.push($el.val());
            });
            if(flag){
                return App.render({                     
                    type   : 'error',
                    message: '该发货计划已审核，不能进行删除!'
                })
            }

            ids = _.compact(ids);

            dataService.deleteData(url, {contentType: this.contentType, ids: ids}, function (err, response) {
                if (err) {
                    return App.render({
                        type   : 'error',
                        message: err.responseJSON.error
                    });
                }

                self.getPage();
            });
        },


        gotoForm: function (e) {
            var id = $(e.target).closest('tr').data('id');
            var page = this.collection.currentPage;
            var countPerPage = this.collection.pageSize;
            var url = this.formUrl + id + '/p=' + page + '/c=' + countPerPage;

            if (this.filter) {
                url += '/filter=' + encodeURI(JSON.stringify(this.filter));
            }

            App.ownContentType = true;
            Backbone.history.navigate(url, {trigger: true});
        },


        changeDateRange: function () {
            var stDate = $('#startDate').val();
            var edDate = $('#endDate').val();
            var searchObject;

            this.startDate = new Date(stDate);
            this.endDate = new Date(edDate);

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.startDate = {
                key  : 'startDate',
                type: 'date',
                value: stDate
            };

            this.filter.endDate = {
                key  : 'endDate',
                type: 'date',
                value: edDate
            };

            this.startKey = moment(this.startDate).year() * 100 + moment(this.startDate).month();
            this.endKey = moment(this.endDate).year() * 100 + moment(this.endDate).month();

            searchObject = {
                page: 1,
                filter   : this.filter,
                viewType: 'list'
            };

            this.collection.showMore(searchObject);

            App.filtersObject.filter = this.filter;
                  
            custom.cacheToApp('shippingPlan.filter', this.filter);
        },

        recalcTotal: function () {
            var amount = 0;

            _.each(this.collection.toJSON(), function (model) {
                amount += parseFloat(model.paidAmount);
            });

            this.$el.find('#totalPaidAmount').text(helpers.currencySplitter(amount.toFixed(2)));
        },

        render: function () {
            var self = this;
            var $currentEl;

            $('.ui-dialog ').remove();

            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(this.template);
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());

            this.recalcTotal();
            this.$listTable = $('#listTable');
            $('#top-bar-saveBtn').hide();
            return this;
        }
    });

    return PaymentListView;
});
