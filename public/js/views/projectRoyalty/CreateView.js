define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/projectRoyalty/CreateTemplate.html',
    'models/projectRoyaltyModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, AcceptModel, common, populate, AttachView, SelectView, CONSTANTS,dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'Tasks',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker'

        },


        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new AcceptModel();
            this.responseObj = {};

            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var self=this;
           // var holder = $target.parents('dd').find('.current-selected');
            //var type=holder.attr('id');
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            var contractId=$.trim(this.$el.find('#buildingContract').attr('data-id'));
            var orderId=$.trim(this.$el.find('#order').attr('data-id'));

            if(contractId) {
                dataService.getData(CONSTANTS.URLS.PROJECTROYALTY_GETORDER , {
                    id: contractId
                }, function (response1, context) {
                    self.responseObj['#order']=response1;
                    if(orderId) {
                        dataService.getData(CONSTANTS.URLS.PROJECTROYALTY_GETGOODNOTES , {
                            id: orderId
                        }, function (response2, context) {

                            self.responseObj['#goodNote']=response2;
                        });
                    }
                });
            }
        },

        saveItem: function () {
            var self = this;
            var mid = 56;

            var contractId=$.trim(this.$el.find('#buildingContract').data('id'));
            var orderId=$.trim(self.$el.find('#order').data('id'));
            var goodsNoteId=$.trim(self.$el.find('#goodNote').data('id'));

            if(!contractId){
                return App.render({
                    type   : 'error',
                    message: '请选择合同编号!'
                })
            }

            this.model.save(
                {

                    contractId:contractId,
                    orderId:orderId,
                    goodsNoteId:goodsNoteId
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                    },

                    error: function (model, xhr) {
                        self.hideDialog();
                        return App.render({
                            type   : 'error',
                            message: '发货单已申请!'
                        })
                    }

                });
        },

        render: function () {
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog task-edit-dialog',
                width        : 300,
                title        : 'Create Task',
                buttons      : {
                    save: {
                        text : '创建',
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

            //populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, false, false);
            dataService.getData(CONSTANTS.URLS.PROJECTROYALTY_GETCONTRACT, {
            }, function (response, context) {
                self.responseObj['#buildingContract'] = response;
            });
            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
