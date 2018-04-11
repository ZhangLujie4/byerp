define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/goodsReturn/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS,
             dataService) {

    var EditView = ParentView.extend({
        contentType: 'goodsReturn',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.GOODSRETURN;

            self.eventChannel = options.eventChannel;          

            this.render(options);
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
                dataService.getData( '/shippingPlan/getByProject', {
                    building : id
                }, function (response, context) {
                    console.log(response);
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

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            var projectId = this.$el.find('#projectId').attr('data-id');
            var deliverNumber = this.$el.find('#deliverNumber').attr('data-id');
            var quantity = $.trim(this.$el.find('#quantity').val());
            var reason = $.trim(this.$el.find('#reason').val());
            var orderNumber = $.trim(this.$el.find('#orderNumber').val());

            var data = {
                projectId     : projectId,
                deliverNumber : deliverNumber,
                orderNumber   : orderNumber,
                quantity      : quantity,
                reason        : reason,
                orderNumber   : orderNumber            
            };

            event.preventDefault();

            //this.currentModel.set(data);

            this.currentModel.save(data, {               
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    self.hideDialog();
                    Backbone.history.navigate('easyErp/goodsReturn', {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },

        render: function (options) {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });
            var self = this;
            var notDiv;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 800,
                title      : 'edit goodsReturn',
                buttons    : {
                    save: {
                        text : '修改',
                        class: 'btn blue',
                        click: self.saveItem
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

            this.renderAssignees(this.currentModel);
            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
