define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/stampApprove/editTemplate.html',
    'views/Editor/AttachView',
    'populate',
    'constants',
    'helpers',
    'moment',
    'dataService'
], function (Backbone, $, _, ParentView, EditTemplate, AttachView, populate ,CONSTANTS ,helpers, moment, dataService) {
    'use strict';

    var EditView = ParentView.extend({
        contentType: "stampApprove",
        template   : _.template(EditTemplate),
        responseObj :{},
        events: {
            'click #add'                          : 'appendStamp',
            'click .icon-attach'                  : 'clickInput',
            'click .removeStamp'                  : 'removeStamp'
        },

        initialize: function (options) {

            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/stampApprove';
            this.redirect = options.redirect;
            if (options.collection) {
                this.collection = options.collection;
            }

            this.responseObj['#approve'] = [
                {
                    _id: true,
                    name: '批准'
                },
                {
                    _id: false,
                    name: '不批准'
                }
            ];

            this.render();
        },

        hideDialog: function () {
            $('.edit-stampApprove-dialog').remove();
        },



        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function(){
            var self = this;
            var mid = 39;

            var status = this.$el.find('#status').data('id');
            var opinion = $.trim(this.$el.find('#opinion').val());
            var isApprove = this.$el.find('#approve').data('id');
            var data;

            data = {
                    isApprove: isApprove,
                    status   : status,
                    opinion  : opinion
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
                dialogClass  : 'edit-stampApprove-dialog',
                title        : 'Edit stampApprove',
                width        : self.isWtrack ? '1200' : '900',
                position     : {my: 'center bottom', at: 'center', of: window},
                buttons      : buttons

            });


            this.$el.find('.attachments').append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: 'stampApprove'
                }).render().el
            );


            return this;
        }

    });

    return EditView;
});
