define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/workOrders/CreateTemplate.html',
    'models/WorkOrdersModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, WorkOrdersModel, common, populate, dataService, AttachView, SelectView, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'WorkOrders',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
            'change #workflowNames': 'changeWorkflows'
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new WorkOrdersModel();

            this.render();
        },

        addAttach: function () {
            var $inputFile = this.$el.find('.input-file');
            var $attachContainer = this.$el.find('.attachContainer');
            var $inputAttach = this.$el.find('.inputAttach:last');
            var s = $inputAttach.val().split('\\')[$inputAttach.val().split('\\').length - 1];

            $attachContainer.append('<li class="attachFile">' +
                '<a href="javascript:;">' + s + '</a>' +
                '<a href="javascript:;" class="deleteAttach">Delete</a></li>'
            );

            $attachContainer.find('.attachFile:last').append($inputFile.find('.inputAttach').attr('hidden', 'hidden'));
            $inputFile.append('<input type="file" value="Choose File" class="inputAttach" name="attachfile">');
        },

        deleteAttach: function (e) {
            $(e.target).closest('.attachFile').remove();
        },

        fileSizeIsAcceptable: function (file) {
            if (!file) {
                return false;
            }
            return file.size < App.File.MAXSIZE;
        },

        getWorkflowValue: function (value) {
            var workflows = [];
            var i;

            for (i = 0; i < value.length; i++) {
                workflows.push({name: value[i].name, status: value[i].status, _id: value[i]._id});
            }

            return workflows;
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
            var opportunitieId = this.$el.find('#opportunitieDd').attr('data-id');
            var workNumber = $.trim(this.$el.find('#workNumber').val());
            var processGroup = $.trim(this.$el.find('#processGroup').val());
            var operatorNumber = $.trim(this.$el.find('#operatorNumber').val());
            var operator = $.trim(this.$el.find('#operator').val());

            var chargeItems = [];
            var processContents = [];
            var selectedcharge1 = this.$el.find('.chargeItem1');
            var selectedcharge2 = this.$el.find('.chargeItem2');
            var selectedcharge3 = this.$el.find('.chargeItem3');
            var selectedcharge4 = this.$el.find('.chargeItem4');
            var selectedprocess1 = this.$el.find('.processItem1');
            var selectedprocess2 = this.$el.find('.processItem2');
            var selectedprocess3 = this.$el.find('.processItem3');
            var selectedprocess4 = this.$el.find('.processItem4');
            var selectedprocess5 = this.$el.find('.processItem5');
            var chargeLength = selectedcharge1.length;
            var processLength = selectedprocess1.length;

            //var targetEl;

            for(var i = 0; i < chargeLength ; i++){
                targetEl1 = $(selectedcharge1[i]);
                targetEl2 = $(selectedcharge2[i]);
                targetEl3 = $(selectedcharge3[i]);
                targetEl4 = $(selectedcharge4[i]);
                var chargeItem = targetEl1.find('[data-name="chargeItem"] input').val();
                var chargeunit = targetEl2.find('[data-name="chargeunit"] input').val();
                var chargequantity = targetEl3.find('[data-name="chargequantity"] input').val();
                var chargeprice = targetEl4.find('[data-name="chargeprice"] input').val();
                var chargeItemId = targetEl1.attr('data-id');

                chargeItems.push({
                    chargeItem     : chargeItem,
                    unit           : chargeunit,
                    quantity       : chargequantity,
                    price          : chargeprice,
                    _id            : chargeItemId
                });
            }

            for(var i = 0; i < processLength ; i++){
                targetEl1 = $(selectedprocess1[i]);
                targetEl2 = $(selectedprocess2[i]);
                targetEl3 = $(selectedprocess3[i]);
                targetEl4 = $(selectedprocess4[i]);
                targetEl5 = $(selectedprocess5[i]);
                var processType = targetEl1.find('[data-name="processType"] input').val();
                var processContent = targetEl2.find('[data-name="processContent"] input').val();
                var processunit = targetEl3.find('[data-name="processunit"] input').val();
                var processquantity = targetEl4.find('[data-name="processquantity"] input').val();
                var processprice = targetEl5.find('[data-name="processprice"] input').val();
                var processContentId = targetEl1.attr('data-id');

                processContents.push({
                    processContent     : processContent,
                    unit               : processunit,
                    quantity           : processquantity,
                    processType        : processType,
                    price              : processprice,
                    _id                : processContentId
                });
            }
            

            this.model.save(
                {
                    projectName    : opportunitieId || null,
                    workNumber     : workNumber,
                    chargeItems    : chargeItems,
                    processGroup   : processGroup,
                    processContents: processContents,
                    operatorNumber : operatorNumber,
                    operator       : operator
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        /*var currentModel = model.changed;

                        self.attachView.sendToServer(null, currentModel);*/
                        Backbone.history.navigate('easyErp/workOrders', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        render: function () {
            var formString = this.template();
            var self = this;
            var filterHash;
            var filter;


            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog task-edit-dialog',
                width        : 800,
                title        : 'Create WorkOrder',
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

            dataService.getData('/chargeItems/getChargeItems', {}, function (chargeItems,context) {
                chargeItems = _.map(chargeItems.data, function (chargeItem) {
                    chargeItem.chargeItem = chargeItem.chargeItem;

                    return chargeItem;
                });

                var div1 = context.$el.find('#chargeItemDd1');
                var div2 = context.$el.find('#chargeItemDd2');
                var div3 = context.$el.find('#chargeItemDd3');
                var div4 = context.$el.find('#chargeItemDd4');

                for(var i = 0; i < chargeItems.length; i++){
                    div1.append(" <tr class='chargeItem1' data-index = "+ (i) + " " +"data-id="+ chargeItems[i]._id +" >"+
                                "<th class='centerCell' data-name='chargeItem'>" +  
                                " <input type='text' style='width: 60px; border: 0; text-align:center;' value=" + chargeItems[i].chargeItem + ">"  + "</th>" +
                            "</tr>");
                    div2.append(" <tr class='chargeItem2' data-index = "+ (i) + " " +"data-id="+ chargeItems[i]._id +" >"+
                                "<th class='centerCell' data-name='chargeunit' style='width: 10%'>" + 
                                " <input type='text' style='width: 60px; border: 0; text-align:center;' value=" + chargeItems[i].unit + ">" + "</th>" +
                            "</tr>");
                    div3.append(" <tr class='chargeItem3' data-index = "+ (i) + " " +"data-id="+ chargeItems[i]._id +" >"+
                                "<th class='centerCell' data-name='chargequantity'>" +
                                " <input type='text' style='width: 60px; text-align:center;' value=" + 0 + ">" + "</th>" + 
                            "</tr>");
                    div4.append(" <tr class='chargeItem4' data-index = "+ (i) + " " +"data-id="+ chargeItems[i]._id +" >"+
                                "<th class='centerCell' data-name='chargeprice' style='width: 10%'>" + 
                                " <input type='text' style='width: 60px; border: 0; text-align:center;' value=" + chargeItems[i].price + ">" + "</th>" +
                            "</tr>");
                }
                self.responseObj['#chargeItemDd1'] = chargeItems;
                self.responseObj['#chargeItemDd2'] = chargeItems;
                self.responseObj['#chargeItemDd3'] = chargeItems;
                self.responseObj['#chargeItemDd4'] = chargeItems;
            },this);

            dataService.getData('/processContents/getProcessContents', {}, function (processContents,context) {
                processContents = _.map(processContents.data, function (processContent) {
                    processContent.processContent = processContent.processContent;

                    return processContent;
                });

                var div1 = context.$el.find('#processContentDd1');
                var div2 = context.$el.find('#processContentDd2');
                var div3 = context.$el.find('#processContentDd3');
                var div4 = context.$el.find('#processContentDd4');
                var div5 = context.$el.find('#processContentDd5');
                for(var i = 0; i < processContents.length; i++){
                    div1.append(" <tr class='processItem1' data-index = "+ (i) + " " +"data-id="+ processContents[i]._id +" >"+
                                "<th class='centerCell'  data-name='processType'>" +
                                " <input type='text' style='width: 60px; border: 0; text-align:center;' value=" + processContents[i].processType + ">"  + "</th>" +
                            "</tr>");
                    div2.append(" <tr class='processItem2' data-index = "+ (i) + " " +"data-id="+ processContents[i]._id +" >"+
                                "<th class='centerCell' data-name='processContent'>" +  
                                " <input type='text' style='width: 60px; border: 0; text-align:center;' value=" + processContents[i].processContent + ">" + "</th>" +
                            "</tr>");
                    div3.append(" <tr class='processItem3' data-index = "+ (i) + " " +"data-id="+ processContents[i]._id +" >"+
                                "<th class='centerCell' data-name='processunit' style='width: 10%'>" + 
                                " <input type='text' style='width: 60px; border: 0; text-align:center;' value=" + processContents[i].unit + ">"  + "</th>" +
                            "</tr>");
                    div4.append(" <tr class='processItem4' data-index = "+ (i) + " " +"data-id="+ processContents[i]._id +" >"+
                                "<th class='centerCell'  data-name='processquantity'>" +
                                " <input type='text' style='width: 60px; text-align:center;' value=" + 0 + ">" + "</th>" + 
                            "</tr>");
                    div5.append(" <tr class='processItem5' data-index = "+ (i) + " " +"data-id="+ processContents[i]._id +" >"+
                                "<th class='centerCell'  data-name='processprice'>" +
                                " <input type='text' style='width: 60px; border: 0; text-align:center;' value=" + processContents[i].price + ">"  + "</th>" +
                            "</tr>");
                }
                self.responseObj['#processContentDd1'] = processContents;
                self.responseObj['#processContentDd2'] = processContents;
                self.responseObj['#processContentDd3'] = processContents;
                self.responseObj['#processContentDd4'] = processContents;
                self.responseObj['#processContentDd5'] = processContents;
            },this);

            dataService.getData('/workOrders/getOpportunitie', {}, function (opportunities) {
                opportunities = _.map(opportunities.data, function (opportunitie) {
                    opportunitie.name = opportunitie.name;

                    return opportunitie;
                });

                self.responseObj['#opportunitieDd'] = opportunities;
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
