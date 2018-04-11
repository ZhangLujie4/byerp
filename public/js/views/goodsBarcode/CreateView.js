define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/goodsBarcode/CreateTemplate.html',
    'models/GoodsBarcodeModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, GoodsBarcodeModel, common, populate, dataService, AttachView, SelectView, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'goodsBarcode',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'        : 'showDatePicker',
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new GoodsBarcodeModel();
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
            var barId = this.$el.find('#barId').attr('data-id');
            var wareOpinion = $.trim(this.$el.find('#wareOpinion').val());
            var url = window.location.hash.split('/');

            this.model.save(
                {
                    barId   :  barId,
                    wareOpinion   : wareOpinion,
                    writeOffsId   : url[3]
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
            var formString = this.template();
            var self = this;
            var filterHash;
            var filter;
            var $notDiv;
            var $thisEl;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : 800,
                title        : 'Create goodsBarcode',
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

            var url = window.location.hash.split('/');

            /*dataService.getData('/barCode/getById', {url : url}, function (barCodes) {
                barCodes = _.map(barCodes.data, function (barCode) {
                    barCode.name = barCode.barId;

                    return barCode;
                });
                self.responseObj['#barId'] = barCodes;
            });*/
            
            dataService.getData('/shippingPlan/getBarCodesByName', {url : url}, function (barCodes) {
                barCodes = _.map(barCodes.retValue, function (barCode) {
                    barCode.name = barCode.barId;

                    return barCode;
                });
                self.responseObj['#barId'] = barCodes;
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
