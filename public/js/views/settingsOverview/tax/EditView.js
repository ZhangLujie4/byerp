define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/settingsOverview/settingsEmployee/tax/EditTemplate.html',
    'models/taxModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, EditTemplate, taxModel, moment, CONSTANTS, populate, dataService) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'tax',
        template   : _.template(EditTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/tax';

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
            var level = $.trim($currentEl.find('#level').val());
            var low = $.trim($currentEl.find('#low').val());
            var high = $.trim($currentEl.find('#high').val());
            var rate = $.trim($currentEl.find('#rate').val());
            var countDeduction = $.trim($currentEl.find('#countDeduction').val());

            var data = {
                level : level,
                low   : low,
                high  : high,
                rate  : rate,
                countDeduction : countDeduction
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
                    self.eventChannel.trigger('updateTax');
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
                title        : 'Create tax',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-tax-dialog',
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
