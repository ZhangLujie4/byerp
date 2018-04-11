define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/safetyManagement/AttachView',
    'views/safetyManagement/AddView',
    'text!templates/safetyManagement/EditTemplate.html',
    'models/safetyManagementModel',
    'moment',
    'constants',
    'populate',
    'dataService',
    'pdfobject'
], function ($, _, Backbone, ParentView, AttachView, AddView, EditTemplate, safetyManagementModel, moment, CONSTANTS, populate, dataService, pdfobject) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'safetyManagement',
        template   : _.template(EditTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/safetyManagement';

            self.eventChannel = options.eventChannel;

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
            var classify = $currentEl.find('#classify').data('id');
            var content = $.trim($currentEl.find('#content').val());
            var remark = $.trim($currentEl.find('#remark').val());

            var data = {
                classify: classify,
                content : content,
                remark  : remark
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
                    console.log(0);
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
                title        : 'Edit safetyManagement',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-safetyManagement-dialog',
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

            this.$el.find('.attachments').append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: 'safetyManagement'
                }).render().el
            );

            dataService.getData('/safetyManagement/getClassifyDd', {}, function(response){
                var add = {
                    _id: 'add',
                    name: '...'
                }
                response.push(add);
                self.responseObj['#classify'] = response;
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
