define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/goodsOutNotes/form/FormTemplate.html',
    'text!templates/goodsOutNotes/temps/documentTemp.html',
    'views/dialogViewBase',
    'views/Products/InvoiceOrder/ProductItems',
    'views/goodsOutNotes/PackNote',
    'views/NoteEditor/NoteView',
    'views/goodsOutNotes/EmailView',
    'common',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'helpers/exportToPdf',
    'moment'
], function (Backbone, $, _, FormTemplate, DocumentTemplate, BaseView, ProductItemView, PackNote, NoteEditor, EmailView, common, dataService, populate, CONSTANTS, helpers, exportToPdf, moment) {
    'use strict';

    var FormView = BaseView.extend({
        contentType: CONSTANTS.GOODSOUTNOTES,
        template   : _.template(FormTemplate),
        templateDoc: _.template(DocumentTemplate),

        initialize: function (options) {

            _.bindAll(this, 'render', 'deleteItem');

            if (options.model) {
                this.currentModel = options.model;
            } else {
                this.currentModel = options.collection.getElement();
            }

            this.currentModel.urlRoot = '/goodsOutNotes';

            this.currentModel.on('sync', this.render, this);

            this.responseObj = {};
        },

        events: {
            'click #printPdf:not(.done)': 'printPdf',
            'click #packBtn:not(.done)' : 'packNote',
            'click .sendEmail'          : 'sendEmail',
            'click #attachment_file'    : 'clickInput',
            'click .setDraft'           : 'setDraft',
            'click .saveBtn'            : 'saveQuotation',
            'click .changeStatus'       : 'changeStatus'
        },

        printPdf: function (e) {
            e.preventDefault();
            window.print();
        },

        packNote: function (e) {
            var date = this.$el.find('#date').text() || this.$el.find('#date').val();

            e.preventDefault();

            new PackNote({model: this.currentModel, date: date});
        },

        sendEmail: function (e) {
            var self = this;
            var template = this.$el.find('#templateDiv').html();

            e.preventDefault();

            self.hideDialog();

            exportToPdf.takeToInput({file: template, name: this.model.get('name')}, function (data) {
                return new EmailView({
                    model     : self.currentModel,
                    attachment: data
                });
            });

        },

        changeStatus: function (e) {
            var $target = $(e.target);
            var self = this;
            var status = $target.attr('data-id');
            var modelStatus = this.currentModel.get('status');
            var modelJSON = this.currentModel.toJSON();
            var date = this.$el.find('#date').text() || this.$el.find('#date').val();
            var done = $target.hasClass('done');
            var saveObject = {};
            var allStatus = ['printed', 'picked', 'packed'];
            var answer;

            saveObject.date = helpers.setTimeToDate(date);

            saveObject['status.' + status] = true;

            e.preventDefault();

            if (done) {
                saveObject['status.' + status] = false;
            }

            answer = confirm('确定要操作该出库单吗？');
            if(answer){
                if (status === 'shipped') {
                    if (modelJSON.order.shippingExpenses && modelJSON.order.shippingExpenses.amount && !modelJSON.shippingMethod) {
                        return App.render({
                            type   : 'error',
                            message: '运输方式不可为空，请先打包！'
                        });
                    }
                    allStatus.forEach(function (el) {
                        if (!modelStatus[el]) {
                            saveObject['status.' + el] = true;
                        }
                    });

                    this.$el.find('.list').find('[data-id="' + status + '"] a').addClass('done');
                }else if(status === 'approved'){
                    allStatus = ['printed', 'picked', 'packed', 'shipped'];
                    allStatus.forEach(function (el) {
                        if(!modelStatus[el]) {
                            saveObject['status.' + el] = true;
                        }
                    });

                    this.$el.find('.list').find('[data-id="' + status + '"] a').addClass('done');
                }
                this.currentModel.save(saveObject, {patch: true});
            }
        },

        render: function () {
            var $thisEl = this.$el;
            var model = this.currentModel.toJSON();
            var formString;
            var template;

            if (model.date) {
                model.date = moment(model.date).format('DD MMM, YYYY, H:mm');
            }

            formString = this.template({
                model        : model,
                visible      : this.visible,
                hidePrAndCust: this.hidePrAndCust,
                common : common
            });

            template = this.templateDoc({
                model : model
            });

            $thisEl.html(formString);

            $thisEl.find('#templateDiv').html(template);

            if (!model.status.shipped) {
                this.$el.find('#date').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    minDate    : new Date(model.order.orderDate),
                    maxDate    : new Date()
                }).datepicker('setDate', new Date(model.date));
            }

            this.delegateEvents(this.events);

            App.stopPreload();

            return this;
        }
    });

    return FormView;
});
