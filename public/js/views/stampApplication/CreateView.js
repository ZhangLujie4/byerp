define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/stampApplication/createTemplate.html',
    'text!templates/main/selectTemplate.html',
    'models/stampApplicationModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'views/Notes/NoteView',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, CreateTemplate, selectTemplate, stampApplicationModel, common, populate, ParentView, AttachView, NoteView, CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'stampApplication',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #add'                          : 'appendStamp',
            'click .current-selected.stamp'       : 'showNewSelect',
            'click .icon-attach'                  : 'clickInput',
            'click .removeStamp'                  : 'removeStamp'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');

            this.responseObj['#fileType'] = [
                {
                    _id : '其他',
                    name: '其他'
                },
                {
                    _id : '图纸',
                    name: '图纸'
                },
                {
                    _id : '标书',
                    name: '标书'
                }
                
            ];

            this.render(options);
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
        },

        appendStamp: function(){
            this.$el.find('#stamp-content').append("<div class='stamp-item'><dt></dt> <dd class='_newSelectListWrap'><a type='text' class='current-selected stamp' href='javascript:;'>选择</a>"
                                                    +"<label class='deleteCell centerCell'>"
                                                    +"<span title='Delete' class='icon-close5 removeStamp'></span>"
                                                    +"</label>"
                                                    +"</dd></div>");
        },

        removeStamp: function(e){
            var target = $(e.target);
            var tr = target.closest('div');
            tr.remove();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function () {
            var self = this;
            var mid = 118;
            var model = new stampApplicationModel();
            var projectName = $.trim(this.$el.find('#projectName').data('id'));
            var fileNumber = $.trim(this.$el.find('#fileNumber').val());
            var pageNumber = $.trim(this.$el.find('#pageNumber').val());
            var applyDate = $.trim(this.$el.find('#applyDate').val());
            var applyMan = $.trim(this.$el.find('#applyMan').data('id'));
            var department = $.trim(this.$el.find('#department').data('id'));
            var comment = $.trim(this.$el.find('#comment').val());
            var fileType = $.trim(this.$el.find('#fileType').data('id'));
            var stamp = [];
            var itemList = this.$el.find('#stamp-content').children('.stamp-item');
            for(var i = 0; i < itemList.length; i++){
                var item = itemList.eq(i).find('a.stamp');
                var stampId = item.data('id');
                console.log(stampId);
                var stampName = $.trim(item.text());
                var stampItem = {
                    id: stampId,
                    name: stampName
                };
                stamp.push(stampItem);
            }
            model.save(
                { 
                    stamp      : stamp,
                    projectName: projectName,
                    fileNumber : fileNumber,
                    fileType   : fileType,
                    pageNumber : pageNumber,
                    applyDate  : applyDate,
                    applyMan   : applyMan,
                    department : department,
                    comment    : comment
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        var currentModel = model.changed.success;
                        self.attachView.sendToServer(null, currentModel);
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

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

        showStampSelect: function() {

            
            
            return false;
        },

        render: function (options) {
            
            var formString = this.template();
            var self = this;
            var $notDiv;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                draggable    : true,
                autoOpen     : true,
                resizable    : true,
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create settingsStamp',
                buttons    : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        id   : 'createBtnDialog',
                        click: self.saveItem

                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                            self.hideSaveCancelBtns();
                        }
                    }
                }
            });

            $notDiv = this.$el.find('.attach-container');
            var model = new stampApplicationModel;
            this.attachView = new AttachView({
                model       : model,
                contentType : this.contentType,
                isCreate    : true
            });
            $notDiv.append(this.attachView.render().el);

            this.$el.find('#applyDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            dataService.getData('/settingsStamp/getForDD', {}, function(response, context){
                context.responseObj['.current-selected stamp'] = response.data;
            },this);

            dataService.getData('/Opportunities/getForDd', {}, function(response, context){
                context.responseObj['#projectName'] = response.data;
            },this);

            populate.get2name('#applyMan', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false);
            populate.get('#department', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, true, true);


            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;

});
