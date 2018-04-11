define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'text!templates/goodsReturn/UploadTemplate.html',
    'dataService',
    'views/dialogViewBase',
    'models/GoodsReturnModel',
], function (Backbone,
             $,
             _,
             NoteView,
             AttachView,
             UploadTemplate,
             dataService,
             ParentView,
             GoodsReturnModel) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'goodsReturn',
        template   : _.template(UploadTemplate),

        events: {
            //'click #create-barCode-btn' : 'createBarcode'
        },

        initialize: function (options) {
            _.bindAll(this, 'createBarcode', 'render');
            if (options) {
                this.visible = options.visible;
            }

            this.currentModel = new GoodsReturnModel();
            this.responseObj = {};

            this.render();
        },

        createBarcode: function () {

            var self = this;
            var mid = 39;
            var projectId = this.$el.find('#projectId').attr('data-id');
            var deliverNumber = this.$el.find('#deliverNumber').attr('data-id');
            var quantity = $.trim(this.$el.find('#quantity').val());
            var reason = $.trim(this.$el.find('#reason').val());
            var orderNumber = $.trim(this.$el.find('#orderNumber').val());
            var type = this.$el.find('#type').attr('data-id');

            this.currentModel.save(
                {
                    projectId     : projectId,
                    deliverNumber : deliverNumber,
                    orderNumber   : orderNumber,
                    quantity      : quantity,
                    reason        : reason,
                    orderNumber   : orderNumber,
                    type          : type
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        Backbone.history.navigate('easyErp/goodsReturn', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
            
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');

            if (holder.attr('id') === 'projectId') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectNumber($(e.target).attr('id'));
            }
            else{
                holder.text($target.text()).attr('data-id', $target.attr('id'));
            }
        },

        selectNumber: function (id) {

            if (id !== '') {
                dataService.getData( '/goodsReturn/getByBuilding', {
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

        render: function () {
            var formString = this.template();

            var self = this;

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'edit-dialog',
                title      : '新建来料退货',
                width      : '800px',
                buttons      : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        click: self.createBarcode
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }

            });

            dataService.getData('/building/getBuildings', {}, function (buildings) {
                buildings = _.map(buildings.data, function (building) {
                    building.name = building.name;

                    return building;
                });
                self.responseObj['#projectId'] = buildings;
            });



            self.responseObj['#type'] = [
                {
                    _id : 'goodsReturn',
                    name: '建材退货'
                }, {
                    _id : 'oemReturn',
                    name: '来料退货'
                }
            ];

            this.delegateEvents(this.events);

            return this;

        }

    });

    return CreateView;
});
