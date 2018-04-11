define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/aluveneerOrders/ImportTemplate.html',
    'models/AluveneerOrdersModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, AluveneerOrdersModel, common, populate, dataService, AttachView, SelectView, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'AluveneerOrders',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'        : 'showDatePicker',
            'change #workflowNames'  : 'changeWorkflows',
            'click #upload-file-btn' : 'uploadFile'
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new AluveneerOrdersModel();
            
            this.render();
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
        },

        addAttach: function () {
            var $inputFile = this.$el.find('.input-file');
            var $attachContainer = this.$el.find('.attachContainer');
            var $inputAttach = this.$el.find('.inputAttach:last');
            var s = $inputAttach.val().split('\\')[$inputAttach.val().split('\\').length - 1];

            $attachContainer.append('<li class="attachFile">' +
                '<a href="javascript:;">' + s + '</a>' +
                '<a href="javascript:;" class="deleteAttach">删除</a></li>'
            );

            $attachContainer.find('.attachFile:last').append($inputFile.find('.inputAttach').attr('hidden', 'hidden'));
            $inputFile.append('<input type="file" value="Choose File" class="inputAttach" name="attachfile">');
        },

        deleteAttach: function (e) {
            $(e.target).closest('.attachFile').remove();
        },

        uploadFile: function (e) {

            var formData = new FormData();
            formData.append('file', $('#file')[0].files[0]);

            $.ajax({
                url: '/aluveneerOrders/importexcel',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                cache      : false,
                success: function(result){
                    url = window.location.hash;

                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
                },
                error: function(error){
                    var tempMessage = error.responseJSON.error.split('Error');
                    var message = tempMessage[0];
                    App.render({
                        type   : 'error',
                        message: message
                    });
                }
            });
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
            var orderNumber = $.trim(this.$el.find('#orderNumber').val());
            var protectType = $.trim(this.$el.find('#protectType').val());
            var acreage = $.trim(this.$el.find('#acreage').val());
            var arrivalDate = $.trim(this.$el.find('#arrivalDate').val());
            var orderMaterial = this.$el.find("[name='orderMaterial']:checked").attr('data-value');
            var employeeId = this.$el.find('#employeesDd').attr('data-id');

            this.model.save(
                {
                    projectName   : opportunitieId,
                    orderNumber   : orderNumber,
                    protectType   : protectType,
                    acreage       : acreage,
                    arrivalDate   : arrivalDate,
                    orderMaterial : orderMaterial,
                    designer      : employeeId,
                    fileStatus    : '文件未上传'
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        /*var currentModel = model.changed;

                        self.attachView.sendToServer(null, currentModel);*/
                        Backbone.history.navigate('easyErp/aluveneerOrders', {trigger: true});
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
            var $notDiv;
            var $thisEl;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : 800,
                title        : 'Create AluveneerOrder',
                buttons      : {
                    /*save: {
                        text : '提交',
                        class: 'btn blue',
                        click: self.saveItem
                    },*/

                    cancel: {
                        text : '取消',
                        class: 'btn blue',
                        click: self.hideDialog
                    }
                }
            });

            this.$el.find('#arrivalDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });

            populate.get2name('#employeesDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {},  this, true, true);

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
