define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/fileManagement/returnTemplate.html',
    'models/fileManagementModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, returnTemplate, fileManagementModel, common, populate, ParentView, CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var BorrowView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'fileManagement',
        template   : _.template(returnTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = options.model || options.collection.getElement();
            this.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function () {
            var self = this;
            var mid = 39;
            var $currentEl = this.$el;
            var borrowDate = $.trim($currentEl.find('#borrowDate').text());
            var returnDate = $.trim($currentEl.find('#returnDate').val());
            var id = $currentEl.find('#certificateNumber').data('id');
            var cId = $currentEl.find('#certificateName').data('id');

            var data = {
                borrowDate: borrowDate,
                returnDate: returnDate,
                cId : cId
            };
            console.log(cId);
            dataService.patchData('/fileManagement/return/' + id, data, function(response){
                Backbone.history.navigate('easyErp/fileManagement', {trigger: true});
            });

        },

        hideSaveCancelBtns: function () {
            var cancelBtnEl = $('#top-bar-saveBtn');
            var saveBtnE1 = $('#top-bar-deleteBtn');
            var createBtnE1 = $('#top-bar-createBtn');
            this.changed = false;

            cancelBtnEl.hide();
            saveBtnE1.hide();
            createBtnE1.show();
            return false;
        },

        render: function (options) {
            dataService.getData('/fileManagement/getReturnInfo', {id: this.currentModel.id}, function(response,context){
                var formString = context.template({
                    model: response,
                    moment: moment
                });
                //var $thisEl = this.$el;


                context.$el = $(formString).dialog({
                    closeOnEscape: false,
                    draggable    : true,
                    autoOpen     : true,
                    resizable    : true,
                    dialogClass: 'edit-dialog',
                    width      : 900,
                    title      : 'Create Certificate',
                    buttons    : {
                        save: {
                            text : '归还',
                            class: 'btn blue',
                            id   : 'createBtnDialog',
                            click: context.saveItem

                        },

                        cancel: {
                            text : '取消',
                            class: 'btn',
                            click: function () {
                                context.hideDialog();
                                context.hideSaveCancelBtns();
                            }
                        }
                    }
                });

                
                context.$el.find('#returnDate').datepicker({
                    dateFormat : 'yy-mm-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                });
                
                context.delegateEvents(context.events);

                return context;
            }, this);
            
        }
    });

    return BorrowView;

});
