define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/shippingPlan/form/FormTemplate.html',
    'text!templates/shippingPlan/temps/documentTemp.html',
    'views/dialogViewBase',
    'views/Products/InvoiceOrder/ProductItems',
    'views/shippingPlan/PackNote',
    'views/NoteEditor/NoteView',
    'views/shippingPlan/EmailView',
    'common',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'helpers/exportToPdf',
    'moment',
    'jstree'
], function (Backbone, $, _, FormTemplate, DocumentTemplate, BaseView, ProductItemView, PackNote, NoteEditor, EmailView, common, dataService, populate, CONSTANTS, helpers, exportToPdf, moment, jstree) {
    'use strict';

    var FormView = BaseView.extend({
        contentType: CONSTANTS.SHIPPINGPLAN,
        template   : _.template(FormTemplate),
        templateDoc: _.template(DocumentTemplate),

        initialize: function (options) {

            _.bindAll(this, 'render');

            if (options.model) {
                this.currentModel = options.model;
            } else {
                this.currentModel = options.collection.getElement();
            }

            this.currentModel.urlRoot = '/shippingPlan';

            this.currentModel.on('sync', this.render, this);

            this.responseObj = {};
        },

        events: {
            'click .setDraft'           : 'setDraft',
            'click .saveBtn'            : 'saveQuotation',
            'change input:not(.checkbox, .checkAll, .statusCheckbox, #inputAttach, #noteTitleArea)': 'showSaveButton',
            'change textarea'           : 'showSaveButton',
            'click #confirm'            : 'confirm',
        },

        showSaveButton: function () {
            $('#top-bar-saveBtn').show();
        },

        hideSaveButton: function () {
            $('#top-bar-saveBtn').hide();
            $('#top-bar-createBtn').hide();
        },

        confirm: function () {
            var model = this.currentModel.toJSON();
            var id = model._id;
            dataService.postData('/shippingPlan/confirm', {id: id}, function(response){
                var url = window.location.hash;
                Backbone.history.fragment = '';
                Backbone.history.navigate(url, {trigger: true});
            });
        },

        render: function () {
            var $thisEl = this.$el;
            var model = this.currentModel.toJSON();
            var formString;
            var template;
            var self = this;

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
                    dateFormat : 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    minDate    : new Date(model.order.orderDate),
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                }).datepicker('setDate', new Date(model.date));
            }
            $('.dateFilter').hide();

            $('#jstree_div').jstree({
                plugins: ["checkbox", "sort", "types", "wholerow", "search", "unique", "contextmenu"],   
                'core': {   
                    'multiple': true,   
                    'data' : function (obj, callback){  
                        $.ajax({
                            url : "/aluveneerOrders/getAluOrder",
                            data: {id: model.order._id},
                            dataType : "json",  
                            type : "GET",  
                            success : function(data) {
                                if(data.length) {
                                    callback.call(this, data);
                                }else{  
                                    $("#jstree_div").html("暂无数据！");  
                                } 
                            },
                            error: function(xhr,textStatus){
                                console.log(xhr);
                            }
                        });  
                    }
              }
            }).on("select_node.jstree", function(){
                self.showSaveButton();
            });
            this.delegateEvents(this.events);
            this.hideSaveButton();
            App.stopPreload();

            return this;
        }
    });

    return FormView;
});
