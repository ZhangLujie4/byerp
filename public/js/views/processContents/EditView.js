﻿define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/processContents/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS) {

    var EditView = ParentView.extend({
        contentType: 'ProcessContents',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.PROCESSCONTENTS;

            self.eventChannel = options.eventChannel;          

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('dd').find('.current-selected');

            endElem.text(target.text()).attr('data-id', target.attr('id'));
            endElem.attr('data-shortdesc', target.data('level'));
        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            var processContent = $.trim($currentEl.find('#processContent').val());
            var unit = $.trim($currentEl.find('#unit').val());
            var price = $.trim($currentEl.find('#price').val());
            var code = $.trim(this.$el.find('#code').val());
            var processType =  $.trim($currentEl.find('#processType').val());

            var data = {
                processContent  : processContent,
                unit            : unit,
                price           : price,
                code            : code,
                processType     : processType
            };

            event.preventDefault();

            //this.currentModel.set(data);

            this.currentModel.save(data , {               
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    self.hideDialog();
                    Backbone.history.navigate('easyErp/processContents', {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },

        render: function (options) {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });
            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 600,
                title      : 'edit processContent',
                buttons    : {
                    save: {
                        text : '保存',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }
            });

            this.renderAssignees(this.currentModel);

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
