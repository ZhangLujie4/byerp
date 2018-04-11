define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/orderApproval/EditTemplate.html',
    'text!templates/orderApproval/chargeItemEdit.html',
    'text!templates/orderApproval/processContentEdit.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
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
             chargeItemEdit,
             processContentEdit,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS,
             dataService) {

    var EditView = ParentView.extend({
        contentType: 'OrderApproval',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.ORDERAPPROVAL;

            self.eventChannel = options.eventChannel;          

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('dd').find('.current-selected');

            endElem.text(target.text()).attr('data-id', target.attr('id'));
            endElem.attr('data-shortdesc', target.data('level'));
        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            var isApproval = true;
            var workNumber = $.trim($currentEl.find('#workNumber').val());
            //var processGroup = $.trim($currentEl.find('#processGroup').val());

            var selectedcharge = $currentEl.find('.chargeItem');
            var selectedprocess = $currentEl.find('.processContent');
            var chargeItems=[];
            var processContents=[];
            var chargeLength = selectedcharge.length;
            var processLength = selectedprocess.length;
            var targetEl1;
            var targetEl2;

            for (var i = 0; i < chargeLength ; i++) {
                targetEl1 = $(selectedcharge[i]);
                var chargeItem = targetEl1.find('[data-name="chargeItems"] input').val();
                var chargeunit = targetEl1.find('[data-name="chargeUnits"] input').val();
                var chargequantity = targetEl1.find('[data-name="chargeQuantities"] input').val();
                var chargeprice = targetEl1.find('[data-name="chargePrices"] input').val();

                chargeItems.push({
                    chargeItem     : chargeItem,
                    unit           : chargeunit,
                    quantity       : chargequantity,
                    price          : chargeprice

                });
            }

            for (var i = 0; i < processLength ; i++) {
                targetEl2 = $(selectedprocess[i]);
                var processType = targetEl2.find('[data-name="processTypes"] input').val();
                var processContent = targetEl2.find('[data-name="processContents"] input').val();
                var processunit = targetEl2.find('[data-name="processUnits"] input').val();
                var processquantity = targetEl2.find('[data-name="processQuantities"] input').val();
                var processprice = targetEl2.find('[data-name="processPrices"] input').val();

                processContents.push({
                    processContent     : processContent,
                    unit               : processunit,
                    quantity           : processquantity,
                    processType        : processType,
                    price              : processprice
                });
            }

            var data = {
                workNumber     : workNumber,
                chargeItems    : chargeItems,
                processContents: processContents,
                isApproval     : isApproval
            };

            event.preventDefault();

            this.currentModel.set(data);

            this.currentModel.save(this.currentModel.changed, {               
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    self.hideDialog();
                    Backbone.history.navigate('easyErp/orderApproval', {trigger: true});
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

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 800,
                title      : 'edit orderApproval',
                buttons    : {
                    save: {
                        text : '审核',
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

            dataService.getData('/workOrders/getOpportunitie', {}, function (opportunities) {
                opportunities = _.map(opportunities.data, function (opportunitie) {
                    opportunitie.name = opportunitie.name;

                    return opportunitie;
                });

                self.responseObj['#opportunitieDd'] = opportunities;
            });

            var chargeItemE;
            var processContentE;
            var chargeItemContainer;
            var processContentContainer;
            var chargeItemModel=this.currentModel.toJSON();
            //var ID=inventoryModel.project._id;
            //this.selectProject(ID);

            if (chargeItemModel.chargeItems) {
                chargeItemE = chargeItemModel.chargeItems;
                if (chargeItemE) {
                    chargeItemContainer = this.$el.find('#chargeItemList');
                    chargeItemContainer.append(_.template(chargeItemEdit, {
                        chargeItem        : chargeItemE

                    }));

                }
            } 

            if (chargeItemModel.processContents) {
                processContentE = chargeItemModel.processContents;
                if (processContentE) {
                    processContentContainer = this.$el.find('#processContentList');
                    processContentContainer.append(_.template(processContentEdit, {
                        processContent        : processContentE

                    }));

                }
            } 

            this.renderAssignees(this.currentModel);

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
