define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'views/safetyManagement/AddView',
    'text!templates/safetyManagement/CreateTemplate.html',
    'models/safetyManagementModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, AttachView, AddView, CreateTemplate, safetyManagementModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'safetyManagement',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click .icon-attach'                  : 'clickInput',
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;

            self.eventChannel = options.eventChannel;
            this.isCreate = true;

            self.render(options);
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').attr('accept', '.pdf');
            this.$el.find('.input-file .inputAttach').click();

        },

        chooseOption: function (e) {
            var $target = $(e.target);

            if($target.attr('id') == 'add'){
                return new AddView();
            }
            else{
                $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
                $('.newSelectList').hide();
            }
            
        },

        sendToServer: function (event, model, self) {
            var currentModel = this.model;
            var elementId = this.elementId || 'addAttachments';
            var currentModelId = currentModel ? currentModel.id : null;
            var addFrmAttach = this.$el.find('#' + elementId);
            var fileArr = [];
            var $thisEl = this.$el;
            var addInptAttach;

            if (!self) {
                self = this;
            }

            if (this.isCreate) {
                currentModel = model;
                currentModelId = currentModel.id || currentModel._id;

                $thisEl.find('li .inputAttach').each(function () {
                    addInptAttach = $(this)[0].files[0];
                    fileArr.push(addInptAttach);

                    if(addInptAttach.name.substring(addInptAttach.name.lastIndexOf('.') + 1) != 'pdf'){
                        return App.render({
                            type   : 'error',
                            message: '附件格式错误，不是pdf格式'
                        });
                    }
                    if (!self.fileSizeIsAcceptable(addInptAttach)) {
                        return App.render({
                            type   : 'error',
                            message: '附件文件太大. 最大字节数: ' + App.File.MaxFileSizeDisplay
                        });
                    }
                });
                if ($thisEl.find('li .inputAttach').length === 0) {
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});

                    return;
                }
                addInptAttach = fileArr;

            } else {
                addInptAttach = addFrmAttach.find('#inputAttach')[0].files[0];

                if(addInptAttach.name.substring(addInptAttach.name.lastIndexOf('.') + 1) != 'pdf'){
                        return App.render({
                            type   : 'error',
                            message: '附件格式错误，不是pdf格式'
                        });
                    }
                if (!this.fileSizeIsAcceptable(addInptAttach)) {
                    $thisEl.find('#inputAttach').val('');

                    return App.render({
                        type   : 'error',
                        message: '附件文件太大. 最大字节数: ' + App.File.MaxFileSizeDisplay
                    });
                }
            }

            addFrmAttach.submit(function (e) {
                var bar = $thisEl.find('.bar');
                var status = $thisEl.find('.status');
                var contentType = self.contentType ? self.contentType.toLowerCase() : '';
                var formURL;

                $('.input-file-button').off('click');

                if (self.import) {
                    formURL = 'http://' + window.location.host + '/importFile';
                } else {
                    formURL = 'http://' + window.location.host + '/' + contentType + '/uploadFiles/';
                }

                e.preventDefault();
                addFrmAttach.ajaxSubmit({
                    url        : formURL,
                    type       : 'POST',
                    processData: false,
                    contentType: false,
                    data       : [addInptAttach],

                    beforeSend: function (xhr) {
                        var statusVal = '0%';

                        xhr.setRequestHeader('modelid', currentModelId);
                        xhr.setRequestHeader('addNote', true);
                        xhr.setRequestHeader('modelname', self.contentType);
                        status.show();
                        bar.width(statusVal);
                        status.html(statusVal);
                    },

                    uploadProgress: function (event, position, total, statusComplete) {
                        var statusVal = statusComplete + '%';

                        bar.width(statusVal);
                        status.html(statusVal);
                    },

                    success: function () {

                        Backbone.history.fragment = '';
                        Backbone.history.navigate(window.location.hash, {trigger: true});

                    },

                    error: function (xhr) {
                        $('.attachContainer').empty();
                        $('.bar .status').empty();
                        if (self) {
                            self.errorNotification(xhr);
                        }
                    }
                });
            });
            addFrmAttach.submit();
            addFrmAttach.off('submit');
        },

        fileSizeIsAcceptable: function (file) {
            if (!file) {
                return false;
            }
            return file.size < App.File.MAXSIZE;
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;

            var classify = $.trim($currentEl.find('#classify').data('id'));
            var content = $.trim($currentEl.find('#content').val());
            var remark = $.trim($currentEl.find('#remark').val());

            var data = {
                classify: classify,
                content : content,
                remark  : remark
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            model = new safetyManagementModel();
            model.urlRoot = function () {
                return 'safetyManagement';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function (model) {
                    var currentModel = model.changed.success;
                    self.sendToServer(null, currentModel);
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var formString = this.template();
            var self = this;
            var $notDiv;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create safetyManagement',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-safetyManagement-dialog',
                        class: 'btn blue',
                        text : '创建',
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
                    }]

            });

            $notDiv = this.$el.find('.attach-container');
            var model = new safetyManagementModel;
            this.attachView = new AttachView({
                model       : model,
                contentType : this.contentType,
                isCreate    : true
            });
            $notDiv.append(this.attachView.render().el);

            dataService.getData('/safetyManagement/getClassifyDd', {}, function(response){
                var add = {
                    _id: 'add',
                    name: '...'
                }
                response.push(add);
                self.responseObj['#classify'] = response;
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
