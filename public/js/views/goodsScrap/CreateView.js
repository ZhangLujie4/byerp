define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/goodsScrap/CreateTemplate.html',
    'models/GoodsScrapModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, GoodsScrapModel, common, populate, dataService, AttachView, SelectView, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'goodsScrap',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'        : 'showDatePicker',
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new GoodsScrapModel();
            this.render();
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
        },

        showDatePicker: function () {
            var $createDatePicker = $('.createFormDatepicker');

            if ($createDatePicker.find('.arrow').length === 0) {
                $createDatePicker.append('<div class="arrow"></div>');
            }
        },

        saveItem: function () {
            var self = this;
            var mid = 39;
            var projectId = this.$el.find('#projectId').attr('data-id');
            var deliverNumber = this.$el.find('#deliverNumber').attr('data-id');
            var quantity = $.trim(this.$el.find('#quantity').val());
            var reason = $.trim(this.$el.find('#reason').val());
            var orderNumber = $.trim(this.$el.find('#orderNumber').val());
            var barId = this.$el.find('#barId').attr('data-id');
            var wareOpinion = $.trim(this.$el.find('#wareOpinion').val());

            this.model.save(
                {   
                    projectId     : projectId,
                    deliverNumber : deliverNumber,
                    orderNumber   : orderNumber,
                    quantity      : quantity,
                    reason        : reason,
                    orderNumber   : orderNumber,
                    barId         : barId,
                    wareOpinion   : wareOpinion
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        url = window.location.hash;
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(url, {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                }
            );
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');

            if (holder.attr('id') === 'projectId') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectProject($(e.target).attr('id'));
            }
            else if (holder.attr('id') === 'deliverNumber') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectNumber($(e.target).attr('id'));
            }
            else{
                holder.text($target.text()).attr('data-id', $target.attr('id'));
            }
        },

        selectProject: function (id) {

            if (id !== '') {
                dataService.getData( '/shippingPlan/getByProject', {
                    building : id
                }, function (response, context) {
                    if (response) {
                        var deliverNumber;
                        deliverNumber = _.map(response.retValue, function (deliverNumber) {
                            deliverNumber = {
                                _id   : deliverNumber._id,
                                name  : deliverNumber.trips
                            }
                            return deliverNumber;
                        });

                        context.responseObj['#deliverNumber'] = deliverNumber;                       

                    }
                }, this);
            } else {
                this.$el.find('#deliverNumber').val('');
            }

        },

        selectNumber: function (id) {

            if (id !== '') {
                dataService.getData( '/shippingPlan/getBarCodesByGoodNote', {
                    id : id
                }, function (response, context) {
                    if (response) {
                        var barCode;
                        barCode = _.map(response.retValue, function (barCode) {
                            barCode = {
                                _id   : barCode._id,
                                name  : barCode.barId
                            }
                            return barCode;
                        });

                        context.responseObj['#barId'] = barCode;                       

                    }
                }, this);
            } else {
                this.$el.find('#barId').val('');
            }

        },

        render: function () {
            var formString = this.template();
            var self = this;
            var filterHash;
            var filter;
            var $notDiv;
            var $thisEl;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : 800,
                title        : 'Create goodsScrap',
                buttons      : {
                    save: {
                        text : '提交',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn blue',
                        click: self.hideDialog
                    }
                }
            });

            var url = window.location.hash.split('/');

            /*dataService.getData('/barCode/getById', {url : url}, function (barCodes) {
                barCodes = _.map(barCodes.data, function (barCode) {
                    barCode.name = barCode.barId;

                    return barCode;
                });
                self.responseObj['#barId'] = barCodes;
            });*/

            dataService.getData('/building/getBuildings', {}, function (buildings) {
                buildings = _.map(buildings.data, function (building) {
                    building.name = building.name;

                    return building;
                });
                self.responseObj['#projectId'] = buildings;
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
