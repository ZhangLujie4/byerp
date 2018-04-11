define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/settingsStamp/editTemplate.html',
    'populate',
    'constants',
    'helpers',
    'moment'
], function (Backbone, $, _, ParentView, EditTemplate, populate ,CONSTANTS ,helpers, moment) {
    'use strict';

    var EditView = ParentView.extend({
        contentType: "settingsStamp",
        template   : _.template(EditTemplate),
        responseObj :{},
        events: {
        },

        initialize: function (options) {

            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/settingsStamp';
            this.redirect = options.redirect;
            if (options.collection) {
                this.collection = options.collection;
            }
            
            this.render();
        },

         hideDialog: function () {
            $('.edit-settingsStamp-dialog').remove();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function(){
            var self = this;
            var mid = 39;
            var name = $.trim(this.$el.find('#name').val());
            var comment = $.trim(this.$el.find('#comment').val());
            var stampsCode = $.trim(this.$el.find('#stampsCode').val());
            var type = $.trim(this.$el.find('#type').val());
            var approvalProcess = $.trim(this.$el.find('#approvalProcess').val());
            var keeper = $.trim(this.$el.find('#keeper').data('id'));
            var charger = $.trim(this.$el.find('#charger').data('id'));
            var startDate = $.trim(this.$el.find('#startDate').val());
            var data;
            data = {
                    approvalProcess: approvalProcess,
                    name       : name,
                    comment    : comment,
                    stampsCode : stampsCode,
                    keeper     : keeper,
                    charger    : charger,
                    startDate  : startDate,
                    type       : type
                };
            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                wait   : true,
                patch  : true,
                success: function () {
                    self.hideDialog();
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },
        
        render: function () {
            var self = this;
            var formString;
            var buttons;
            var model = this.currentModel.toJSON();

            this.$el.delegate(function(events){
                event.stopPropagation();
                event.preventDefault();
            });

            formString = this.template({
                model           : model,
            });

            buttons = [
                {
                    text : '保存',
                    class: 'btn blue',
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
                }
            ];

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-settingsStamp-dialog',
                title        : 'Edit settingsStamp',
                width        : self.isWtrack ? '1200' : '900',
                position     : {my: 'center bottom', at: 'center', of: window},
                buttons      : buttons

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

            return this;
        }

    });

    return EditView;
});
