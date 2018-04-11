define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/stampApplication/editTemplate.html',
    'views/Editor/AttachView',
    'populate',
    'constants',
    'helpers',
    'moment',
    'dataService'
], function (Backbone, $, _, ParentView, EditTemplate, AttachView, populate ,CONSTANTS ,helpers, moment, dataService) {
    'use strict';

    var EditView = ParentView.extend({
        contentType: "stampApplication",
        template   : _.template(EditTemplate),
        responseObj :{},
        events: {
            'click #add'                          : 'appendStamp',
            'click .icon-attach'                  : 'clickInput',
            'click .removeStamp'                  : 'removeStamp'
        },

        initialize: function (options) {

            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/stampApplication';
            this.redirect = options.redirect;
            if (options.collection) {
                this.collection = options.collection;
            }

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

            this.render();
        },

        hideDialog: function () {
            $('.edit-stampApplication-dialog').remove();
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

        saveItem: function(){
            var self = this;
            var mid = 39;

            var projectName = $.trim(this.$el.find('#projectName').data('id'));
            var fileNumber = $.trim(this.$el.find('#fileNumber').val());
            var pageNumber = $.trim(this.$el.find('#pageNumber').val());
            var applyDate = $.trim(this.$el.find('#applyDate').val());
            var applyMan = $.trim(this.$el.find('#applyMan').data('id'));
            var department = $.trim(this.$el.find('#department').data('id'));
            var comment = $.trim(this.$el.find('#comment').val());
            var fileType = $.trim(this.$el.find('#fileType').data('id'));

            var data;
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


            data = {
                    stamp      : stamp,
                    projectName: projectName,
                    fileNumber : fileNumber,
                    fileType   : fileType,
                    pageNumber : pageNumber,
                    applyDate  : applyDate,
                    applyMan   : applyMan,
                    department : department,
                    comment    : comment
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
            var model = this.currentModel.toJSON();

            this.$el.delegate(function(events){
                event.stopPropagation();
                event.preventDefault();
            });

            formString = this.template({
                model           : model,
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
                dialogClass  : 'edit-stampApplication-dialog',
                title        : 'Edit stampApplication',
                width        : self.isWtrack ? '1200' : '900',
                position     : {my: 'center bottom', at: 'center', of: window},
                buttons      : buttons

            });


            this.$el.find('.attachments').append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: 'stampApplication'
                }).render().el
            );
            dataService.getData('/settingsStamp/getForDD', {}, function(response, context){
                context.responseObj['.current-selected stamp'] = response.data;
            },this);

            dataService.getData('/Opportunities/getForDd', {}, function(response, context){
                context.responseObj['#projectName'] = response.data;
            },this);

            populate.get2name('#applyMan', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false);
            populate.get('#department', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, true, true);



            return this;
        }

    });

    return EditView;
});
