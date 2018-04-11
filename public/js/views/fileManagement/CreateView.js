define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/fileManagement/createTemplate.html',
    'models/CertificateModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'views/Notes/NoteView',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, CreateTemplate, CertificateModel, common, populate, ParentView, AttachView, NoteView, CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'fileManagement',
        template   : _.template(CreateTemplate),
        responseObj: {},
        events: {
            'mouseenter .avatar'   : 'showEdit',
            'mouseleave .avatar'   : 'hideEdit',
            'click #avatar:not(#inputImg)': 'showBigPic',
            'click .icon-attach'          : 'clickInput'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.model = new CertificateModel();
            this.render(options);
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function () {
            var self = this;
            var mid = 39;
            var certificateNumber = $.trim(this.$el.find('#certificateNumber').val());
            var certificateName = $.trim(this.$el.find('#certificateName').val());
            var genre = $.trim(this.$el.find('#genre').val());
            var name = $.trim(this.$el.find('#name').val());
            var ID = $.trim(this.$el.find('#ID').val());
            var phone = $.trim(this.$el.find('#phone').val());
            var receiptDate = $.trim(this.$el.find('#receiptDate').val());
            var startDate = $.trim(this.$el.find('#startDate').val());
            var issuer = $.trim(this.$el.find('#issuer').val());
            var filedDate = $.trim(this.$el.find('#filedDate').val());
            var validDate = $.trim(this.$el.find('#validDate').val());
            var remark = $.trim(this.$el.find('#remark').val());
            var level = $.trim(this.$el.find('#level').val());
            this.model.save(
                {
                    certNo           : certificateNumber,
                    name             : certificateName,
                    genre            : genre,
                    holder           : {
                        name : name,
                        ID   : ID,
                        phone: phone
                    },
                    receiptDate      : receiptDate,
                    startDate        : startDate,
                    issuer           : issuer,
                    filedDate        : filedDate,
                    validDate        : validDate,
                    remark           : remark,
                    level            : level
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        var currentModel = model.changed.success;
                        // Backbone.history.navigate('easyErp/fileManagement', {trigger: true});
                        self.attachView.sendToServer(null, currentModel);
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
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
            //var $thisEl = this.$el;
            var $notDiv;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                draggable    : true,
                autoOpen     : true,
                resizable    : true,
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create Certificate',
                buttons    : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        id   : 'createBtnDialog',
                        click: self.saveItem

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


            $notDiv = this.$el.find('.attach-container');
            var model = new CertificateModel;
            this.attachView = new AttachView({
                model       : model,
                contentType : this.contentType,
                isCreate    : true
            });
            $notDiv.append(this.attachView.render().el);

            this.$el.find('#filedDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });
            this.$el.find('#validDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });
            this.$el.find('#startDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });
            this.$el.find('#receiptDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });
            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;

});
