define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'text!templates/aluveneerOrders/UploadTemplate.html',
    'views/dialogViewBase',
    'models/AluveneerOrdersModel',
], function (Backbone,
             $,
             _,
             NoteView,
             AttachView,
             UploadTemplate,
             ParentView,
             AluveneerOrdersModel) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'aluveneerOrders',
        template   : _.template(UploadTemplate),

        events: {
            'click #upload-graph-btn' : 'uploadGraph'
        },

        initialize: function (options) {
            _.bindAll(this, 'render');
            if (options) {
                this.visible = options.visible;
            }

            this.currentModel = new AluveneerOrdersModel();
            this.listUrl = options.listUrl;
            this.responseObj = {};

            this.render();
        },

        uploadGraph: function (e) {

            var formData = new FormData();
            formData.append('file', $('#file')[0].files[0]);

            var orderNumber = this.listUrl;

            $.ajax({
                url: '/aluveneerOrders/importGraph/' + orderNumber,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                cache      : false,
                success: function(result){
                    url = window.location.hash;

                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
                },
                error: function(error){
                    var message = error.responseJSON.error;
                    App.render({
                        type   : 'error',
                        message: message
                    });
                }
            });
        },

        render: function () {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });

            var self = this;

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'edit-dialog',
                title      : '设计图',
                width      : '600px',
                buttons    : [{
                    text : '取消',
                    class: 'btn',
                    click: function () {
                        self.hideDialog();
                    }
                }]

            });


        }

    });

    return CreateView;
});
