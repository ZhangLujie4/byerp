define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/engineerInfo/createTemplate.html',
    'models/engineerInfoModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'constants',
    'moment',
    'helpers',
    'dataService',
    'distpicker'
], function (Backbone, $, _, CreateTemplate, engineerInfoModel, common, populate, ParentView, AttachView ,CONSTANTS, moment, helpers, dataService, distpicker) {
    'use strict';

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'engineerInfo',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.model = new engineerInfoModel();

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
            var quality = $.trim(this.$el.find('#quality').val());
            var issArea = $.trim(this.$el.find('#issArea').val());
            var amount = this.$el.find('#amount').val();
            var StartDate = $.trim(this.$el.find('#StartDate').val());
            var EndDate = $.trim(this.$el.find('#EndDate').val());
            var pmr = $.trim(this.$el.find('#pmr').val());
            var pmv = $.trim(this.$el.find('#pmv').val());
            var cancelDate = $.trim(this.$el.find('#cancelDate').val());
            var province = $.trim(this.$el.find('#province option:selected').val());
            var city = $.trim(this.$el.find('#city option:selected').val());
            var district = $.trim(this.$el.find('#district option:selected').val());
            var zip = $.trim(this.$el.find('#zip').val());
            var constructionUnit = $.trim(this.$el.find('#constructionUnit').val());
            var supervisionUnit = $.trim(this.$el.find('#supervisionUnit').val());
            var contractUnit = $.trim(this.$el.find('#contractUnit').val());

            this.model.save(
                {
                    name       : name,
                    quality    : quality,
                    issArea    : issArea,
                    amount     : amount,
                    StartDate  : StartDate,
                    EndDate    : EndDate,
                    pmr        : pmr,
                    pmv        : pmv,
                    cancelDate : cancelDate,
                    address: {
                        province: province,
                        city    : city,
                        district: district,
                        zip     : zip
                    },
                    constructionUnit: constructionUnit,
                    supervisionUnit : supervisionUnit,
                    contractUnit    : contractUnit
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        Backbone.history.navigate('easyErp/engineerInfo', {trigger: true});
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


            this.$el.find('#StartDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            this.$el.find('#EndDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            this.$el.find('#cancelDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            this.$el.find('#address').distpicker({
                province: '---- 所在省 ----',
                city: '---- 所在市 ----',
                district: '---- 所在区 ----'
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;

});
