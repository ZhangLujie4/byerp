define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/engineerInfo/engineerManager/EditTemplate.html',
    'models/engineerManagerModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, EditTemplate, engineerManagerModel, moment, CONSTANTS, populate, dataService) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'engineerManager',
        template   : _.template(EditTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/engineerInfo/engineerManager';

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
            var jobPosition = $.trim($currentEl.find('#jobPosition').val());
            var enterTime = $.trim($currentEl.find('#enterTime').val());
            var age = $currentEl.find('#age').val();
            var jobType = $.trim($currentEl.find('#jobType').val());
            var jobQua = $.trim($currentEl.find('#jobQua').val());
            var certificate = $.trim($currentEl.find('#certificate').val());
            var phone = $.trim($currentEl.find('#phone').val());
            var remark = $.trim($currentEl.find('#remark').val());
            var data = {
                name       : name,
                jobPosition: jobPosition,
                enterTime  : enterTime,
                age        : age,
                jobType    : jobType,
                jobQua     : jobQua,
                certificate: certificate,
                phone      : phone,
                remark     : remark,
                engineerInfo: this.engineerInfoID
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }



            this.currentModel.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
                    self.eventChannel.trigger('engineerManagerUpdated');
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
            var model = this.currentModel.toJSON();
            var formString = this.template({
                model: model
            });
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Edit engineerManager',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'edit-engineerManager-dialog',
                        class: 'btn blue',
                        text : '保存',
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

            return this;
        }

    });

    return EditView;
});
