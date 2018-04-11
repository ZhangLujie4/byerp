define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'text!templates/scanlogs/UploadTemplate.html',
    'dataService',
    'views/dialogViewBase',
    'models/ScanlogsModel',
], function (Backbone,
             $,
             _,
             NoteView,
             AttachView,
             UploadTemplate,
             dataService,
             ParentView,
             ScanlogsModel) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'scanlogs',
        template   : _.template(UploadTemplate),

        events: {
            //'click #create-barCode-btn' : 'createBarcode'
        },

        initialize: function (options) {
            _.bindAll(this, 'createBarcode', 'render');
            if (options) {
                this.visible = options.visible;
            }

            this.currentModel = new ScanlogsModel();
            this.responseObj = {};

            this.render();
        },

        createBarcode: function () {

            var self = this;
            var mid = 39;
            var orderRowId = this.$el.find('#orderRowId').attr('data-id');
            var barId = $.trim(this.$el.find('#barId').val());

            var data = {
                orderRowId    : orderRowId,
                barId         : barId          
            };

            dataService.postData('/scanlogs/createBarcode', data, function (err, result) {
                if (err) {
                    return console.log(err);
                }

                Backbone.history.navigate('easyErp/scanlogs', {trigger: true});

            });
            
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');
            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        render: function () {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });

            var self = this;

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'edit-dialog',
                title      : '新建barCode',
                width      : '600px',
                buttons      : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        click: self.createBarcode
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }

            });

            dataService.getData('/aluveneerOrders/getById', {}, function (orderRows) {
                orderRows = _.map(orderRows.data, function (orderRow) {
                    orderRow.name = orderRow.cgdh + '-' +orderRow.lbmc + '-' + orderRow.lbbh;

                    return orderRow;
                });
                self.responseObj['#orderRowId'] = orderRows;
            });

            this.delegateEvents(this.events);

            return this;

        }

    });

    return CreateView;
});
