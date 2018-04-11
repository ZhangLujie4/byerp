define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/purchaseOrders/ImportTemplate.html',
    'views/dialogViewBase',
    'models/orderModel'
], function (Backbone,
             $,
             _,
             CreateTemplate,
             ParentView,
             orderModel) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'purchaseOrders',
        template   : _.template(CreateTemplate),
        forSales   : true,

        initialize: function (options) {
            _.bindAll(this, 'uploadFile', 'render');
            if (options) {
                this.visible = options.visible;
            }
            this.model = new orderModel();
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
                url: '/purchaseOrders/importexcel/' + fileName,
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
                        message: '订单已上传成功，共上传'+result.data.length+'条数据。'
                    });
                },
                error: function(jqxhr){
                    var tempMessage = jqxhr.responseJSON.error.split('Error');
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
                title      : '采购计划',
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
