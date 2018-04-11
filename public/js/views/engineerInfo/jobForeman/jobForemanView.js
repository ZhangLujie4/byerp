define([
    'Underscore',
    'jQuery',
    'text!templates/engineerInfo/jobForeman/jobForemanTemplate.html',
    'text!templates/engineerInfo/jobForeman/ListTemplate.html',
    'views/listViewBase',
    'views/engineerInfo/jobForeman/EditView',
    'views/engineerInfo/jobForeman/CreateView',
    'collections/jobForeman/filterCollection',
    'models/jobForemanModel',
    'common',
    'helpers',
    'dataService',
    'constants',
    'helpers/eventsBinder'
], function (_, 
             $, 
             jobForemanTopBar, 
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
             eventsBinder) {
    'use strict';

    var jobForemanView = ListViewBase.extend({
        el                  : '#jobForeman',
        contentCollection   : currentCollection,
        preventChangLocation: true,
        templateHeader      : _.template(jobForemanTopBar),
        templateList        : _.template(ListTemplate),

        events: {
            'click .checkbox'                        : 'checked',
            'click #createJobForeman'                : 'createJobForeman',
            'click #removeJobForeman'                : 'removeItems',
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

            model.urlRoot = '/engineerInfo/jobForeman';
            model.fetch({
                data   : {id: id, contentType: this.contentType},
                success: function (model) {
                    return new EditView({
                        model        : model,
                        eventChannel : self.eventChannel
                    });
                },

                error: function () {
                    App.render({
                        type   : 'error',
                        message: 'Please refresh browser'
                    });
                }
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
            var table = $('#jobForemanTable');

            event.preventDefault();

            listTableCheckedInput = table.find("input:not('#checkAll_jobForeman'):checked");
            count = listTableCheckedInput.length;
            this.collectionLength = this.collection.length;

            if (answer === true) {
                $.each(listTableCheckedInput, function (index, checkbox) {
                    model = that.collection.get(checkbox.value);
                    model.urlRoot = function () {
                        return 'engineerInfo/jobForeman';
                    };
                    model.destroy({
                        headers: {
                            mid: mid
                        },
                        wait   : true,
                        success: function (model) {
                            var id = model.get('_id');

                            table.find('[data-id="' + id + '"]').remove();

                            $('#removeJobForeman').hide();
                            $('#checkAll_jobForeman').prop('checked', false);

                            if (that.eventChannel) {
                                that.eventChannel.trigger('elemCountChanged');
                            }

                        },

                        error: function (model, res) {
                            if (res.status === 403 && index === 0) {
                                App.render({
                                    type   : 'error',
                                    message: 'You do not have permission to perform this action'
                                });
                            }
                            that.listLength--;
                            count--;
                            if (count === 0) {
                                that.deleteCounter = localCounter;
                                that.deletePage = $('#currentShowPage').val();
                                that.deleteItemsRender(that.deleteCounter, that.deletePage);
                            }
                        }
                    });
                });
            }

        },

        checked: function (e) {
            var el = this.$el;
            var $targetEl = $(e.target);
            var checkLength = el.find('input.checkbox:checked').length;
            var checkAll$ = el.find('#checkAll_jobForeman');
            var removeBtnEl = $('#removeJobForeman');
            var createBtnEl = $('#createJobForeman');

            e.stopPropagation();

            if ($targetEl.hasClass('notRemovable')) {
                $targetEl.prop('checked', false);

                return false;
            }

            if (this.collection.length > 0) {
                if (checkLength > 0) {
                    checkAll$.prop('checked', false);

                    removeBtnEl.show();
                    createBtnEl.hide();

                    if (checkLength === this.collection.length) {

                        checkAll$.prop('checked', true);
                    }
                } else {
                    removeBtnEl.hide();
                    createBtnEl.show();
                    checkAll$.prop('checked', false);
                }
            }
        },

        createJobForeman: function (e) {
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

            $holder.find('#listTableJobForeman').html(this.templateList({
                jobForeman      : newModels.toJSON(),
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

            $currentEl.find('#listTableJobForeman').html(this.templateList({
                jobForeman      : this.collection.toJSON(),
                startNumber     : 0,
                dateToLocal     : common.utcDateToLocaleDate,
                currencySplitter: helpers.currencySplitter,
                currencyClass   : helpers.currencyClass
            }));

            this.renderPagination($currentEl, this);

            this.$el.find('#removeJobForeman').hide();

            $('#checkAll_jobForeman').click(function () {
                self.$el.find(':checkbox:not(.notRemovable)').prop('checked', this.checked);
                if ($('input.checkbox:checked').length > 0) {
                    $('#removeJobForeman').show();
                } else {
                    $('#removeJobForeman').hide();
                }
            });

        }

    });

    return jobForemanView;
});
