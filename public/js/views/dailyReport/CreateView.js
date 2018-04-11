define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/dailyReport/CreateTemplate.html',
    'views/dialogViewBase',
    'models/dailyReportModel',
    'helpers/keyValidator',
    'populate',
    'constants'
], function (Backbone, $, _, CreateTemplate, ParentView, dailyReportModel, keyValidator, populate, CONSTANTS) {

    var CreateView = ParentView.extend({
        el                  : '#content-holder',
        template            : _.template(CreateTemplate),
        imageSrc            : '',
        searchProdCollection: null,
        responseObj: {},

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.render();
        },
        saveItem: function (e) {
            var $el = this.$el;
            var self = this;
            var content = $el.find('#content').val()? $el.find('#content').val().replace(/\n|\r\n/g,"<br>") : '';
            var review = $el.find('#review').val()? $el.find('#review').val().replace(/\n|\r\n/g,"<br>") : '';

            data={
                content: content,
                review: review
            };
            console.log(data);
            var model = new dailyReportModel();
            //产生一个post请求
            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function (model, response) {
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
        },

        render: function () {
            var self = this;
            var formString = self.template({});

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 900,
                height     : 440,
                title      : 'Create DailyReport',
                buttons    : {
                    save: {
                        text : '确定',
                        class: 'btn blue',
                        click: function () {
                            self.saveItem();
                        }
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }
                }
            });

            this.delegateEvents(self.events);

            return this;
        }

    });

    return CreateView;
});
