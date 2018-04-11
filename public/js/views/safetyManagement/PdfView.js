define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'text!templates/safetyManagement/PdfTemplate.html',
    'models/safetyManagementModel',
    'moment',
    'constants',
    'populate',
    'dataService',
    'pdfobject'
], function ($, _, Backbone, ParentView, AttachView, CreateTemplate, safetyManagementModel, moment, CONSTANTS, populate, dataService, pdfobject) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'safetyManagement',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            self.attachments = options.attachments;
            //self.eventChannel = options.eventChannel;
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

            var classify = $.trim($currentEl.find('#classify').val());

            var data = {
                classify: classify,
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            dataService.postData('/safetyManagement/createClassify', data, function(result){
                self.hideDialog();
            });
        },

        hideDialog: function () {
            $('.edit-addClassify-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-addClassify-dialog',
                title        : 'Create safetyManagement',
                width        : '900px',
                buttons      : [
                    {
                        text : '关闭',
                        class: 'btn blue',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });
            console.log(this.attachments);
            var path ='download/' + this.attachments[0].shortPas;
            console.log(this.attachments[0].shortPas);
            console.log(path);
            var option = {
                fallbackLink: "<p>该浏览器不支持，请点击<a href="+path+">链接</a>下载</p>"
            };
            pdfobject.embed(path, '#pdf-content', option);

            $('.pdfobject-container').css('height', '500px');

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
