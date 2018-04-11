define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/settingsStamp/createTemplate.html',
    'models/StampModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, CreateTemplate, StampModel, common, populate, ParentView, AttachView ,CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'settingsStamp',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.model = new StampModel();
            this.render(options);
        },


        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            
        },

        saveItem: function () {
            var self = this;
            var mid = 118;

            var name = $.trim(this.$el.find('#name').val());
            var comment = $.trim(this.$el.find('#comment').val());
            var stampsCode = $.trim(this.$el.find('#stampsCode').val());
            var type = $.trim(this.$el.find('#type').val());
            var approvalProcess = $.trim(this.$el.find('#approvalProcess').val());
            var keeper = $.trim(this.$el.find('#keeper').data('id'));
            var charger = $.trim(this.$el.find('#charger').data('id'));
            var startDate = $.trim(this.$el.find('#startDate').val());

            this.model.save(
                { 
                    name       : name,
                    comment    : comment,
                    approvalProcess: approvalProcess,
                    type       : type,
                    keeper     : keeper,
                    charger    : charger,
                    stampsCode : stampsCode,
                    startDate  : startDate
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        Backbone.history.navigate('easyErp/settingsStamp', {trigger: true});
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

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                draggable    : true,
                autoOpen     : true,
                resizable    : true,
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create settingsStamp',
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

            this.$el.find('#startDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            populate.get2name('#keeper', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false);
            populate.get2name('#charger', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false);

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;

});
