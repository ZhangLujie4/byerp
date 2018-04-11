define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'text!templates/socialInsurance/ReportTemplate.html',
    'models/socialInsuranceModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, AttachView, ReportTemplate, socialInsuranceModel, moment, CONSTANTS, populate, dataService) {

    var ReportView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'socialInsurance',
        template   : _.template(ReportTemplate),
        responseObj: {},
       

        initialize: function (options) {
            this.model = options.model;
            var self = this;

            self.eventChannel = options.eventChannel;

            self.render(options);
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },


        render: function (options) {
            var formString = this.template({
                issues: this.model
            });
            var self = this;
            var $notDiv;
            this.attachView = new AttachView({
                model      : new socialInsuranceModel(),
                contentType: this.contentType,
                isCreate   : true
            });
            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create socialInsurance',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [

                    {
                        text : '确定',
                        class: 'btn blue',
                        click: function () {
                            self.hideDialog();
                            var url = window.location.hash;
                            console.log(url);
                            Backbone.history.fragment = '';
                            Backbone.history.navigate(url, {trigger: true});
                            
                        }
                    }]

            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return ReportView;
});
