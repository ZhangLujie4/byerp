define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/fileManagement/borrowAllTemplate.html',
    'models/fileManagementModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, borrowAllTemplate, fileManagementModel, common, populate, ParentView, CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var borrowAllView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'fileManagement',
        template   : _.template(borrowAllTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            //this.currentModel = options.model || options.collection.getElement();
            this.model = new fileManagementModel();
            this.dataArray = options.dataArray;
            console.log(this.dataArray);
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

            var reason = $.trim($currentEl.find('#reason').val());
            var borrowDate = $.trim($currentEl.find('#borrowDate').val());
            var expectedDate = $.trim($currentEl.find('#expectedDate').val());
            var borrowDepartment = $currentEl.find('#borrowDepartment').data('id');
            var name = $.trim($currentEl.find('#name').val());
            var ID = $.trim($currentEl.find('#ID').val());
            var phone = $.trim($currentEl.find('#phone').val());

            var dataAll = [];
            this.dataArray.forEach(function(item, index){
                var data = {
                    certificate : item,
                    reason      : reason,
                    borrowDate  : borrowDate,
                    expectedDate: expectedDate,
                    borrowDepartment : borrowDepartment,
                    borrower           : {
                        name    : name,
                        ID      : ID,
                        phone   : phone
                    }
                };
                dataAll.push(data);
            });
            
            dataService.postData('/fileManagement/borrowAll', dataAll, function(){
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
            
            var formString = this.template({
                moment: moment
            });
            var self = this;
            //var $thisEl = this.$el;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                draggable    : true,
                autoOpen     : true,
                resizable    : true,
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create Certificates',
                buttons    : {
                    save: {
                        text : '借出',
                        class: 'btn blue',
                        id   : 'borrowAllBtnDialog',
                        click: self.saveItem

                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();

                        }
                    }
                }
            });



            populate.get('#borrowDepartment', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, true, true);
            
            this.$el.find('#expectedDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            this.$el.find('#borrowDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });
            
            this.delegateEvents(this.events);

            return this;
        }
    });

    return borrowAllView;

});
