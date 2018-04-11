define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/shippingPlan/createTemplate.html',
    'models/shippingPlanModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, CreateTemplate, currentModel, common, populate, ParentView, AttachView ,CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'shippingPlan',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
             _.bindAll(this, 'gotoForm');
            this.model = new currentModel();
            this.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._newSelectListWrap').find('.current-selected');
            if(holder.attr('id') === 'projectName'){
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                var opid = this.$el.find('#projectName').data('id');

                dataService.getData('/produceSchedule/getOrderNumber', {_id: opid}, function (orderNumbers, context) {
                    orderNumbers = _.map(orderNumbers.data, function (orderNumber) {
                        orderNumber.name = orderNumber._id;
                        return orderNumber;
                    });
                    context.responseObj['#cgdh'] = orderNumbers;
                }, this);
            }
            else{
                holder.text($target.text()).attr('data-id', $target.attr('id'));
            }
        },

        gotoForm: function () {
            var customer = this.$el.find('#customerDd').data('id');
            var cgdh = this.$el.find('#cgdh').data('id');
            var projectId = this.$el.find('#projectName').data('id');
            var data = {
                customer: customer,
                cgdh: cgdh,
                projectId: projectId
            }
            dataService.getData('shippingPlan/getOrderId', data, function(response){
                var orderId = response._id;
                var url = 'easyErp/order/tform/'+ orderId;
                Backbone.history.navigate(url, {trigger: true});
            })
        },

        hideSaveCancelBtns: function () {
            var cancelBtnEl = $('#top-bar-saveBtn');
            var saveBtnE1 = $('#top-bar-deleteBtn');
            var createBtnE1 = $('#top-bar-createBtn');
            this.changed = false;

            cancelBtnEl.hide();
            saveBtnE1.hide();
            createBtnE1.show();
            return false;
        },

        render: function (options) {
            
            var formString = this.template();
            var self = this;
            var notDiv;
            var date = moment().format("YYYY-MM-DD");


            this.$el = $(formString).dialog({
                closeOnEscape: false,
                draggable    : true,
                autoOpen     : true,
                resizable    : true,
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create shippingPlan',
                buttons    : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        id   : 'createBtnDialog',
                        click: self.gotoForm

                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                            self.hideSaveCancelBtns();
                        }
                    }
                }
            });

            dataService.getData('/building/getCustomers', {}, function (customers) {
                customers = _.map(customers.data, function (customer) {
                    customer.name = customer.name.first + ' ' + customer.name.last;

                    return customer;
                });

                self.responseObj['#customerDd'] = customers;
            });

            dataService.getData('/building/getBuildings', {}, function (buildings) {
                buildings = _.map(buildings.data, function (building) {
                    building.name = building.name;

                    return building;
                });

                self.responseObj['#projectName'] = buildings;
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;

});
