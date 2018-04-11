define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/goodsPlan/CreateTemplate.html',
    'views/dialogViewBase',
    'models/goodsPlanModel'
], function (Backbone,
             $,
             _,
             CreateTemplate,
             ParentView,
             GoodsPlanModel) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'goodsPlan',
        template   : _.template(CreateTemplate),
        forSales   : true,

        initialize: function (options) {
            _.bindAll(this, 'uploadFile', 'render');
            if (options) {
                this.visible = options.visible;
            }
            this.model = new GoodsPlanModel();
            this.responseObj = {};
            this.currencySymbol = '$';
            this.deletedProducts = [];

            this.render();
        },

        uploadFile: function (e) {
            var formData = new FormData();
            formData.append('file', $('#file')[0].files[0]);
            
            var fileName = $('#file')[0].files[0].name;

            $.ajax({
                url: '/goodsPlan/importexcel/' + fileName,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                cache      : false,
                success: function(result){
                    url = window.location.hash;
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
                    return App.render({
                        type   : 'notify',
                        message: '领料计划已上传成功，共上传'+result.data.length+'条数据。'
                    });
                },
                error: function(error){
                    var tempMessage = error.responseJSON.error.split('Error');
                    var message = tempMessage[0];
                    App.render({
                        type   : 'error',
                        message: message
                    });
                }
            });
        },

        render: function () {
            var formString = this.template({visible: this.visible, forSales: this.forSales, project: this.projectId});
            var self = this;
            var curDate = new Date();

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'edit-dialog',
                title      : '新建领料计划',
                width      : '500px',
                buttons    : [{
                    id   : 'create-person-dialog',
                    text : '上传',
                    class: 'btn blue',
                    click: function () {
                        self.uploadFile();
                    }
                }, {
                    text : '取消',
                    class: 'btn',
                    click: function () {
                        self.hideDialog();
                    }
                }]

            });

            return this;
        }

    });

    return CreateView;
});
