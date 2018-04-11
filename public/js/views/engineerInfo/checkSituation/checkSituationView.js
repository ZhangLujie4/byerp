define([
    'Underscore',
    'jQuery',
    'text!templates/engineerInfo/checkSituation/checkSituationTemplate.html',
    'text!templates/engineerInfo/checkSituation/ListTemplate.html',
    'views/listViewBase',
    'views/engineerInfo/checkSituation/EditView',
    'views/engineerInfo/checkSituation/CreateView',
    'collections/checkSituation/filterCollection',
    'models/checkSituationModel',
    'common',
    'helpers',
    'dataService',
    'constants',
    'helpers/eventsBinder',
    'moment'
], function (_, 
             $, 
             checkSituationTopBar, 
             ListTemplate, 
             ListViewBase,
             EditView, 
             CreateView, 
             currentCollection, 
             CurrentModel, 
             common, 
             helpers, 
             dataService, 
             CONSTANTS, 
             eventsBinder,
             moment) {
    'use strict';

    var checkSituationView = ListViewBase.extend({
        el                  : '#checkSituation',
        contentCollection   : currentCollection,
        preventChangLocation: true,
        templateHeader      : _.template(checkSituationTopBar),
        templateList        : _.template(ListTemplate),

        events: {
            'click .checkbox'                        : 'checked',
            'click #createCheckSituation'            : 'createCheckSituation',
            'click #removeCheckSituation'           : 'removeItems',
            'click .list td:not(.notForm, .checkbox)': 'goToEditDialog',
            'click .stageSelect'                     : 'showNewSelect'
        },

        initialize: function (options) {
            this.remove();
            this.visible = options.visible;
            this.model = options.model;
            this.collection = options.collection;
            this.engineerInfoID = options.engineerInfoID;
            this.customerId = options.customerId;
            this.filter = options.filter || {};
            this.defaultItemsNumber = 50;
            this.page = options.page || 1;
            this.eventChannel = options.eventChannel;

            eventsBinder.subscribeCollectionEvents(this.collection, this);
        },

        chooseOption: function (e) {
            var target$ = $(e.target);
            var targetElement = target$.closest('tr');
            var parentTd = target$.closest('td');
            var a = parentTd.find('a');
            var id = targetElement.attr('data-id');
            var model = this.collection.get(id);

            model.save({
                workflow: {
                    _id : target$.attr('id'),
                    name: target$.text()
                }
            }, {
                headers: {
                    mid: 55
                },

                patch   : true,
                validate: false,
                success : function () {
                    a.text(target$.text());
                }
            });

            this.hideNewSelect();

            return false;
        },

        goToEditDialog: function (e) {
            var self = this;
            var id = $(e.target).closest('tr').attr('data-id');
            var model = new CurrentModel({validate: false});

            e.preventDefault();

            dataService.getData('/engineerInfo/checkSituation', {id: id}, function(response){
                return new EditView({
                    model        : response,
                    eventChannel : self.eventChannel
                });
            });
        },

        renderProformRevenue: function (modelQuot) {
            var proformContainer = $('#proformRevenueContainer');
            var modelJSON = modelQuot.toJSON();

            var orderSum = proformContainer.find('#orderSum');
            var orderCount = proformContainer.find('#orderCount');
            var totalSum = proformContainer.find('#totalSum');
            var totalCount = proformContainer.find('#totalCount');
            var total = orderSum.attr('data-value');
            var order = orderSum.attr('data-value');
            var newTotal;
            var newOrder;

            total = parseFloat(total);
            order = parseFloat(order);
            newTotal = total + parseFloat(modelJSON.paymentInfo.total);
            newOrder = order + parseFloat(modelJSON.paymentInfo.total);

            orderSum.attr('data-value', newOrder);
            orderSum.text(helpers.currencySplitter(newOrder.toString()));

            totalSum.attr('data-value', newTotal);
            totalSum.text(helpers.currencySplitter(newTotal.toString()));

            orderCount.text(parseFloat(orderCount.text()) + 1);
            totalCount.text(parseFloat(totalCount.text()) + 1);
        },

        removeItems: function (event) {
            var answer = confirm('Really DELETE items ?!');
            var that = this;
            var mid = 39;
            var model;
            var localCounter = 0;
            var listTableCheckedInput;
            var count;
            var table = $('#checkSituationTable');
            var timeStamps = [];
            event.preventDefault();

            listTableCheckedInput = table.find("input:not('#checkAll_checkSituation'):checked");
            count = listTableCheckedInput.length;
            this.collectionLength = this.collection.length;

            if (answer === true) {
                $.each(listTableCheckedInput, function (index, checkbox) {
                    var $el = $(this);
                    var timeStamp = $el.attr('data-id');
                    timeStamps.push(timeStamp);
                });

                dataService.deleteData('engineerInfo/checkSituation', {timeStamps: timeStamps}, function (err, response) {
                    if (err) {
                        return App.render({
                            type   : 'error',
                            message: 'Can\'t remove items'
                        });
                    }
                    if(that.eventChannel){
                        that.eventChannel.trigger('checkSituationRemove');
                    }
                    
                });
            }

        },

        checked: function (e) {
            var el = this.$el;
            var $targetEl = $(e.target);
            var checkLength = el.find('input.checkbox:checked').length;
            var checkAll$ = el.find('#checkAll_checkSituation');
            var removeBtnEl = $('#removeCheckSituation');
            var createBtnEl = $('#createCheckSituation');
            var status = $targetEl.parent().parent().find('.status').data('content');
            console.log(status);
            e.stopPropagation();

            if ($targetEl.hasClass('notRemovable')) {
                $targetEl.prop('checked', false);

                return false;
            }

            if (this.collection.length > 0) {
                if (checkLength > 0) {
                    if (status == 'In Progress'){
                         return App.render({
                            type   : 'error',
                            message: '该数据已经经过审批，不能删除'
                        });

                    }
                    else{
                        checkAll$.prop('checked', false);
                        createBtnEl.hide();
                        removeBtnEl.show();

                        if (checkLength === this.collection.length) {

                            checkAll$.prop('checked', true);
                        }
                    }
                    
                } else {
                    createBtnEl.show();
                    removeBtnEl.hide();
                    checkAll$.prop('checked', false);
                }
            }
        },

        createCheckSituation: function (e) {
            e.preventDefault();
  
            return new CreateView({
                collection      : this.collection,
                engineerInfoID  : this.engineerInfoID,
                model           : this.model,
                eventChannel    : this.eventChannel
            });
        },

        showMoreContent: function (newModels) {
            var $holder = this.$el;
            var pagenation;

            this.hideDeleteBtnAndUnSelectCheckAll();

            $holder.find('#listTableCheckSituation').html(this.templateList({
                checkSituation  : newModels.toJSON(),
                startNumber     : 0,
                dateToLocal     : common.utcDateToLocaleDate,
                currencySplitter: helpers.currencySplitter,
                currencyClass   : helpers.currencyClass
            }));

            pagenation = $holder.find('.pagination');

            if (newModels.length !== 0) {
                pagenation.show();
            } else {
                pagenation.hide();
            }

            if (typeof (this.recalcTotal) === 'function') {
                this.recalcTotal();
            }
        },

        render: function () {
            var $currentEl = this.$el;
            var self = this;

            $currentEl.html('');
            $currentEl.prepend(this.templateHeader);

            $currentEl.find('#listTableCheckSituation').html(this.templateList({
                checkSituation  : this.collection.toJSON(),
                startNumber     : 0,
                dateToLocal     : common.utcDateToLocaleDate,
                currencySplitter: helpers.currencySplitter,
                currencyClass   : helpers.currencyClass,
                moment          : moment
            }));

            this.renderPagination($currentEl, this);

            this.$el.find('#removeCheckSituation').hide();

            $('#checkAll_checkSituation').click(function () {
                self.$el.find(':checkbox:not(.notRemovable)').prop('checked', this.checked);
                if ($('input.checkbox:checked').length > 0) {
                    $('#removeCheckSituation').show();
                } else {
                    $('#removeCheckSituation').hide();
                }
            });

        }

    });

    return checkSituationView;
});
