define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/oemBarcode/CreateAllTemplate.html',
    'text!templates/oemBarcode/ProductAllItems.html',
    'models/OemBarcodeModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, ProductItems, OemBarcodeModel, common, populate, dataService, AttachView, SelectView, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'oemBarcode',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'        : 'showDatePicker',
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new OemBarcodeModel();
            this.orderModels = options.orderModels;
            this.render();
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
        },

        showDatePicker: function () {
            var $createDatePicker = $('.createFormDatepicker');

            if ($createDatePicker.find('.arrow').length === 0) {
                $createDatePicker.append('<div class="arrow"></div>');
            }
        },

        saveItem: function () {
            var self = this;
            var mid = 39;
            var selectedproduct = this.$el.find('.productItem');
            var selectedLength = selectedproduct.length;
            var oemOrder=[];
            var targetEl;
            var writeOffsId = this.$el.find('#projectId').attr('data-id');
            var wareOpinion = this.$el.find('#wareOpinion').val();

            for (var i = 0; i < selectedLength; i++) {
                targetEl = $(selectedproduct[i]);

                var orderRowId = targetEl.attr('id');
                var returnQuantity = targetEl.find('#returnQuantity').val();
                var productDd = targetEl.find('#productDd').attr('data-id');

                oemOrder.push({
                    orderRowId  :  orderRowId,
                    quantity    :  returnQuantity,
                    wareOpinion :  wareOpinion,
                    product     :  productDd
                });

            }

            this.model.save(
                {
                    writeOffsId   : writeOffsId,
                    oemOrder      : oemOrder
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        url = window.location.hash;
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(url, {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                }
            );
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            var holder = $target.parents('._modalSelect').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        render: function () {
            var orderModels = this.orderModels;
            console.log(orderModels);
            var formString = this.template({model: orderModels});
            console.log(orderModels);
            var self = this;
            var filterHash;
            var filter;
            var $notDiv;
            var $thisEl;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : 1000,
                title        : 'Create oemBarcode',
                buttons      : {
                    save: {
                        text : '提交',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn blue',
                        click: self.hideDialog
                    }
                }
            });

            this.delegateEvents(this.events);

            this.$el.find('#productItemsHolder').html(_.template(ProductItems, {orderModels : orderModels}));

            return this;
        }

    });

    return CreateView;
});
