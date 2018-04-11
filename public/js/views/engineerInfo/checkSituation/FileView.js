define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/engineerInfo/checkSituation/FileTemplate.html',
    'views/Editor/AttachView',
    'populate',
    'constants',
    'helpers',
    'moment',
    'dataService'
], function (Backbone, $, _, ParentView, EditTemplate, AttachView, populate ,CONSTANTS ,helpers, moment, dataService) {
    'use strict';

    var EditView = ParentView.extend({
        contentType: "checkSituation",
        template   : _.template(EditTemplate),
        responseObj :{},
        events: {
            'click .icon-attach'                  : 'clickInput',
        },

        initialize: function (options) {

            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/checkSituation';
            this.redirect = options.redirect;
            if (options.collection) {
                this.collection = options.collection;
            }

            this.render();
        },

        hideDialog: function () {
            $('.edit-checkSituation-dialog').remove();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },
        
        render: function () {
            var self = this;
            var formString;
            var buttons;
            var model = this.currentModel;

            var attachments = this.model.attachments;

            var optionObj = {
                attachments: attachments,
                elementId  : 'addAttachments',
                moment     : moment
            };
            this.$el.delegate(function(events){
                event.stopPropagation();
                event.preventDefault();
            });

            formString = this.template(optionObj);

            buttons = [
                {
                    text : '取消',
                    class: 'btn blue',
                    click: function () {
                        self.hideDialog();
                    }
                }
            ];

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-checkSituation-dialog',
                title        : 'Edit checkSituation',
                width        : self.isWtrack ? '1200' : '900',
                position     : {my: 'center bottom', at: 'center', of: window},
                buttons      : buttons

            });

            // this.$el.find('.attachments').append(
            //     new AttachView({
            //         model      : this.currentModel,
            //         contentType: 'checkSituation'
            //     }).render().el
            // );

            return this;
        }

    });

    return EditView;
});
