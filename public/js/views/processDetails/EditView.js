define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/processDetails/EditTemplate.html',
    'text!templates/processDetails/chargeItemEdit.html',
    'text!templates/processDetails/processContentEdit.html',
    'models/ProcessDetailsModel',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             chargeItemEdit,
             processContentEdit,
             ProcessDetailsModel,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS) {

    var EditView = ParentView.extend({
        contentType: 'ProcessDetails',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.PROCESSDETAILS;

            self.eventChannel = options.eventChannel; 
            this.model = new ProcessDetailsModel();         

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
            var tempModel = this.currentModel.toJSON();
            var $currentEl = this.$el;
            var opportunitieId = $currentEl.find('#opportunitieDd').attr('data-id');
            var workNumber = $.trim($currentEl.find('#workNumber').val());
            var fillDate = $.trim($currentEl.find('#fillDate').val());
            var operator = $.trim($currentEl.find('#operator').val());
            var completePercent = tempModel.completePercent;
            var processCost = tempModel.processCost;
            var projectDepCost = tempModel.projectDepCost;

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


            this.model.save(
                {
                    projectName    : opportunitieId || null,
                    workNumber     : workNumber,                   
                    chargeItems    : chargeItems,
                    processContents: processContents,
                    fillDate       : fillDate,
                    completePercent: completePercent,
                    projectDepCost : projectDepCost,
                    processCost    : processCost,
                    operator       : operator
                }, 
                {

                    headers: {
                        mid: mid
                    },
                    wait   : true,

                    success: function (model) {
                        
                        Backbone.history.navigate('easyErp/processDetails', {trigger: true});
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
                title      : 'edit processDetail',
                buttons    : {
                    save: {
                        text : '申报',
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
