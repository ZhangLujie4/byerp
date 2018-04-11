define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/oemOutNote/editTemplate.html',
    'views/Editor/AttachView',
    'populate',
    'constants',
    'helpers',
    'moment',
    'dataService',
    'helpers/keyValidator',
], function (Backbone, $, _, ParentView, EditTemplate, AttachView, populate ,CONSTANTS ,helpers, moment, dataService, keyValidator) {
    'use strict';

    var EditView = ParentView.extend({
        contentType: "oemOutNote",
        template   : _.template(EditTemplate),
        responseObj :{},
        events: {
            'click #add'                          : 'appendStamp',
            'click .icon-attach'                  : 'clickInput',
            'click .removeStamp'                  : 'removeStamp',
            'keypress  .quantity'                 : 'keypressHandler',
            'keyup .quantity'                     : 'keyupHandler',
        },

        initialize: function (options) {

            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/oemOutNote';
            this.redirect = options.redirect;
            if(options.model){
                this.model = options.model;
            }
            console.log(this.model.toJSON());
            this.render();
        },

        hideDialog: function () {
            $('.edit-stampApprove-dialog').remove();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        keyupHandler: function (e) {
            var $target = $(e.target);
            var index = $target.parents('tr').data('sort');
            var model = this.model.toJSON();
            var value = parseInt($target.val());
            if(model.orderRows[index].quantity<value){
                $target.val(model.orderRows[index].quantity);
            }
        },

        keypressHandler: function (e) {
            return keyValidator(e, true, true);
        },

        saveItem: function(){
            var self = this;
            var mid = 39;

            var license = $.trim(this.$el.find('#license').val());
            var trips = $.trim(this.$el.find('#trips').val());
            var deliverMan = $.trim(this.$el.find('#deliverMan').val());
            var salesman = $.trim(this.$el.find('#salesman').val());
            var fee = $.trim(this.$el.find('#fee').val());
            var fee1 = $.trim(this.$el.find('#fee1').val());
            var orderRowsArray = this.$el.find('.orderRow');
            var orderRows = [];
            var shipDate = this.$el.find('#shipDate').val();
            orderRowsArray.each(function(){
                var orderRowId = $(this).data('id');
                var quantity = $(this).find('.quantity').val();
                var orderRow = {
                    orderRowId: orderRowId,
                    quantity: quantity
                }
                orderRows.push(orderRow);
            })
            var data;

            data = {
                license: license,
                trips: trips,
                deliverMan: deliverMan,
                salesman: salesman,
                fee: fee,
                fee1: fee1,
                shipDate: shipDate,
                orderRows: orderRows
            };
            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                wait   : true,
                patch  : true,
                success: function () {
                    self.hideDialog();
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },
        
        render: function () {
            var self = this;
            var formString;
            var buttons;
            var model = this.model.toJSON();

            this.$el.delegate(function(events){
                event.stopPropagation();
                event.preventDefault();
            });
            console.log(model);

            formString = this.template({
                model: model,
                moment: moment
            });

            buttons = [
                {
                    text : '保存',
                    class: 'btn blue',
                    click: function () {
                        self.saveItem();
                    }
                },
                {
                    text : '取消',
                    class: 'btn',
                    click: function () {
                        self.hideDialog();
                    }
                }
            ];

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-stampApprove-dialog',
                title        : 'Edit stampApprove',
                width        : '1200',
                position     : {my: 'center bottom', at: 'center', of: window},
                buttons      : buttons

            });

            this.$el.find('#shipDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            return this;
        }

    });

    return EditView;
});
