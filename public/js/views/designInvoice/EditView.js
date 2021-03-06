﻿define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/designInvoice/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService',
    'moment'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS,
             dataService,
             moment) {

    var EditView = ParentView.extend({
        contentType: 'Accept',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {

        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.DESIGNINVOICE;
            this.responseObj['#type'] = [
                {
                    _id : 'invoice',
                    name: '发票'
                }, {
                    _id : 'receive',
                    name: '收据'
                }
            ];
            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;

            var note = $.trim(this.$el.find('#note').val());
            var invoiceDate = $.trim(this.$el.find('#invoiceDate').val());
            var amount = $.trim(this.$el.find('#amount').val());
            var name = $.trim(this.$el.find('#name').val());
            var project = $.trim(this.$el.find('#project').data('id'));
            var department = $.trim(this.$el.find('#department').data('id'));
            var payer = $.trim(this.$el.find('#payer').data('id'));
            var realPayer = $.trim(this.$el.find('#realPayer').data('id'));
            var type = this.$el.find('#type').data('id');

                data = {
                    note:note,
                    invoiceDate:invoiceDate,
                    amount:amount,
                    name:name,
                    payer:payer,
                    project:project,
                    realPayer:realPayer,
                    type:type,
                    department:department
                };
            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {
                    self.hideDialog();
                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        deleteItem: function (event) {
            var mid;
            var self = this;
            var answer;

            event.preventDefault();

            mid=39;

            answer = confirm('Really DELETE items ?!');

            if (answer === true) {
                this.currentModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function (model) {

                        model = model.toJSON();

                        $("tr[data-id='" + model._id + "'] td").remove();
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                        self.hideDialog();
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            }
        },


        render: function () {
            var model=this.currentModel.toJSON();
            var formString = this.template({
                model:model
            });

            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog  task-edit-dialog',
                width: 700,
                buttons: {
                    save: {
                        text: '保存',
                        class: 'btn blue',
                        click: self.saveItem
                    },
                    cancel: {
                        text: '取消',
                        class: 'btn',
                        click: self.hideDialog
                    },
                    delete: {
                        text: '删除',
                        class: 'btn',
                        click: self.deleteItem
                    }
                }
            });


            populate.get('#project', '/DesignProjects/getForDd', {}, 'name', this, false, false);
            populate.get('#department', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, false, false);
            dataService.getData( CONSTANTS.URLS.ENTERPRISE_GETFORDD, {
            }, function (response, context) {
                self.responseObj['#payer']=response;

            });
            dataService.getData( CONSTANTS.URLS.ENTERPRISE_GETFORDD, {
            }, function (response, context) {
                self.responseObj['#realPayer']=response;

            });
            this.$el.find('#invoiceDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            }).datepicker('setDate', new Date());

            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
