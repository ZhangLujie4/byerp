define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/engineerInfo/jobForeman/CreateTemplate.html',
    'models/jobForemanModel',
    'moment',
    'constants',
    'populate',
    'dataService',
    'distpicker'
], function ($, _, Backbone, ParentView, CreateTemplate, jobForemanModel, moment, CONSTANTS, populate, dataService, distpicker) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'jobForeman',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;

            this.engineerInfoID = options.engineerInfoID;
            self.eventChannel = options.eventChannel;
            self.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            $('.newSelectList').hide();
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;

            var name = $.trim($currentEl.find('#name').val());
            var ID = $.trim($currentEl.find('#ID').val());
            var province = $.trim($currentEl.find('#province option:selected').val());
            var city = $.trim($currentEl.find('#city option:selected').val());
            var district = $.trim($currentEl.find('#district option:selected').val());
            var zip = $.trim($currentEl.find('#zip').val());
            var phone = $.trim($currentEl.find('#phone').val());
            var enterTime = $.trim($currentEl.find('#enterTime').val());
            var estimate = $.trim($currentEl.find('#estimate').val());
            var remark = $.trim($currentEl.find('#remark').val());
            var data = {
                name        : name,
                ID          : ID,
                address: {
                    province: province,
                    city    : city,
                    district: district,
                    zip     : zip
                },
                phone       : phone,
                enterTime   : enterTime,
                estimate    : estimate,
                remark      : remark,
                engineerInfo: this.engineerInfoID
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }


            model = new jobForemanModel();
            model.urlRoot = function () {
                return 'engineerInfo/jobForeman';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
                    if (self.eventChannel) {
                        self.eventChannel.trigger('jobForemanUpdated');
                    }
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create jobForeman',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-jobForeman-dialog',
                        class: 'btn blue',
                        text : '创建',
                        click: function () {
                            self.saveItem();
                        }
                    },

                    {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });


            this.delegateEvents(this.events);

            this.$el.find('#enterTime').datepicker({
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
            
            return this;
        }

    });

    return CreateView;
});
