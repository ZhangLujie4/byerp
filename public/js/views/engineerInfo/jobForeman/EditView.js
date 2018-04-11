define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/engineerInfo/jobForeman/EditTemplate.html',
    'models/jobForemanModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, EditTemplate, jobForemanModel, moment, CONSTANTS, populate, dataService) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'jobForeman',
        template   : _.template(EditTemplate),
        responseObj: {},


        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/engineerInfo/jobForeman';

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



            this.currentModel.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
                    self.eventChannel.trigger('jobForemanUpdated');
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
                title        : 'Edit jobForeman',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'edit-jobForeman-dialog',
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

            this.$el.find('#address').distpicker({
                province: model.address.province,
                city: model.address.city,
                district: model.address.district
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
