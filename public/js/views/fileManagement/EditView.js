define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/fileManagement/editTemplate.html',
    'models/CertificateModel',
    'views/fileManagement/AttachView',
    'moment',
    'constants',
    'populate',
    'dataService',
    'common'
], function ($, _, Backbone, ParentView, EditTemplate, CertificateModel, AttachView, moment, CONSTANTS, populate, dataService, common) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'fileManagement',
        template   : _.template(EditTemplate),
        responseObj: {},

         events: {
            'click #attachBody .attachContainer .picture'          : 'showBigPic',
            'click .icon-attach'                                   : 'clickInput'
         },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/fileManagement';

            self.eventChannel = options.eventChannel;
            this.response = options.response;
            self.render(options);
        },


        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
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
            var certificateNumber = $.trim(this.$el.find('#certificateNumber').val());
            var certificateName = $.trim(this.$el.find('#certificateName').data('id'));
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

            var data = {
                certNo           : certificateNumber,
                certificateName  : certificateName,
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
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }



            this.currentModel.save(data, {
                patch  : true,
                headers: {
                    mid: 39
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

        showBigPic: function(e){
            var $target = $(e.target);
            var src = $target.parent().find('.picture').attr('src');
            console.log(src);
            this.$el.find('.big-pic img').attr('src', src);
            this.$el.find('.big-pic img').css('max-width','100%');
            e.preventDefault();
            e.stopPropagation();
             $(".big-pic").dialog({
                dialogClass  : "show-images-dialog",
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                title        : "Show Images",
                width        : "900px",
                buttons      : {
                    cancel: {
                        text : "取消",
                        class: "btn blue",
                        click: function () {
                            $(this).dialog("close");
                            $("#dialogContainer .ui-dialog.show-images-dialog").remove();
                        }
                    }
                }
             });

        },

        render: function (options) {
            var model = this.currentModel.toJSON();
            var formString = this.template({
                model: model,
                history: this.response,
                moment: moment
            });
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create fileManagement',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-fileManagement-dialog',
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
                    contentType: 'fileManagement'
                }).render().el
            );

            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
