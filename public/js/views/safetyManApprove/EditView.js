define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/safetyManagement/AttachView',
    'text!templates/safetyManApprove/EditTemplate.html',
    'models/safetyManagementModel',
    'moment',
    'constants',
    'populate',
    'dataService',
    'pdfobject'
], function ($, _, Backbone, ParentView, AttachView, EditTemplate, safetyManagementModel, moment, CONSTANTS, populate, dataService, pdfobject) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'safetyManApprove',
        template   : _.template(EditTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/safetyManApprove';

            self.eventChannel = options.eventChannel;

            this.responseObj['#approve'] = [
                {
                    _id : true,
                    name: '同意'
                },
                {
                    _id : false,
                    name: '不同意'
                }
            ];

            self.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            if($target.attr('id') == 'add'){
                return new AddView();
            }
            else{
                $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
                $('.newSelectList').hide();
            }
            
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;
            var approve = this.$el.find('#approve').data('id');

            var data = {
                approve: approve,
                status: this.currentModel.toJSON().status
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
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
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
                title        : 'Create safetyManagement',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-safetyManagement-dialog',
                        class: 'btn blue',
                        text : '确认',
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

            this.$el.find('.attachments').append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: 'safetyManagement'
                }).render().el
            );

            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
