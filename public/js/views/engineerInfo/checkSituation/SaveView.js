define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'text!templates/engineerInfo/checkSituation/SaveTemplate.html',
    'collections/managementRule/filterCollection',
    'models/managementRuleModel',
    'models/checkSituationModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, AttachView, CreateTemplate, managementRuleCollection, managementRuleModel, checkSituationModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'checkSituation',
        template   : _.template(CreateTemplate),
        responseObj: {},
        events: {
            'click .icon-attach'                  : 'clickInput',
        },
        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;

            this.engineerInfoID = options.engineerInfoID; 
            this.managementRuleId = options.id || '';
            this.inspector = options.inspector;
            this.inspectDate = options.inspectDate;
            this.content = options.content;
            this.penalty = options.penalty;
            self.eventChannel = options.eventChannel;
            this.timeStamp = options.timeStamp;
            this.isCreate = true;
            self.render(options);
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
        },
        
        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            $('.newSelectList').hide();
        },

        sendToServer: function (event, model, self) {
            var currentModel = this.model;
            var elementId = this.elementId || 'addAttachments';
            var currentModelId = currentModel ? currentModel.id : null;
            var addFrmAttach = this.$el.find('#' + elementId);
            var fileArr = [];
            var addInptAttach;

            if (!self) {
                self = this;
            }

            if (this.isCreate) {
                currentModel = model;
                currentModelId = currentModel.id || currentModel._id;

                this.$el.find('li .inputAttach').each(function () {

                    addInptAttach = $(this)[0].files[0];

                    fileArr.push(addInptAttach);

                    if (!self.fileSizeIsAcceptable(addInptAttach)) {
                        return App.render({
                            type   : 'error',
                            message: 'File you are trying to attach is too big. MaxFileSize: ' + App.File.MaxFileSizeDisplay
                        });
                    }
                });
                if (this.$el.find('li .inputAttach').length === 0) {

                    if (this.contentType === CONSTANTS.PRODUCTS) {
                        self.hideDialog();
                        return;
                    }

                    self.hideDialog();

                    return;
                }
                addInptAttach = fileArr;

            } else {
                addInptAttach = addFrmAttach.find('#inputAttach')[0].files[0];

                if (!this.fileSizeIsAcceptable(addInptAttach)) {
                    this.$el.find('#inputAttach').val('');

                    if (!addInptAttach) {
                        return App.render({
                            type   : 'error',
                            message: '你不能更改文件!'
                        });
                    }

                    return App.render({
                        type   : 'error',
                        message: 'File you are trying to attach is too big. MaxFileSize: ' + App.File.MaxFileSizeDisplay
                    });
                }
            }

            addFrmAttach.submit(function (e) {
                var bar = self.$el.find('.bar');
                var status = self.$el.find('.status');
                var contentType = self.contentType ? self.contentType.toLowerCase() : '';
                var formURL;

                $('.input-file-button').off('click');

                if (self.contentType === CONSTANTS.IMPORT) {
                    formURL = 'http://' + window.location.host + '/importFile';
                } else if (self.contentType === 'checkSituation'){
                    formURL = 'http://' + window.location.host + '/engineerInfo/' + contentType + '/uploadFiles/';
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
                        xhr.setRequestHeader('modelname', self.contentType);
                        xhr.setRequestHeader('timestamp', self.timeStamp);
                        xhr.setRequestHeader('delimiter', App.currentUser.delimiter || ',');
                        status.show();
                        bar.width(statusVal);
                        status.html(statusVal);
                    },

                    uploadProgress: function (event, position, total, statusComplete) {
                        var statusVal = statusComplete + '%';

                        bar.width(statusVal);
                        status.html(statusVal);
                    },

                    success: function (data) {
                        var res;
                        var attachments;

                        if (self.isCreate) {
                            status.hide();
                            self.hideDialog();

                            if (self.contentType === CONSTANTS.PRODUCTS) {
                                return;
                            }

                        } else if (self.contentType === CONSTANTS.IMPORT) {
                            self.trigger('uploadCompleted');
                        } else {
                            //attachments = currentModel ? currentModel.get('attachments') : [];
                            attachments = currentModel.get('attachments') || [];
                            attachments.length = 0;
                            $('.attachContainer').empty();
                            res = data.data || data.result;

                            if (!res) {
                                res = data;
                            }
                            res.attachments.forEach(function (item) {
                                var date = moment(item.uploadDate).format('DD MMM, YYYY, H:mm:ss');
                                attachments.push(item);
                                self.$el.find('.attachContainer').prepend(_.template(addAttachTemplate, {
                                    data: item,
                                    date: date
                                }));
                            });
                            addFrmAttach[0].reset();
                            status.hide();
                        }
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

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;

            var rule = this.managementRuleId;
            var inspector = $.trim($currentEl.find('#inspector').val());
            var inspectDate = $.trim($currentEl.find('#inspectDate').val());
            var rectification = $.trim($currentEl.find('#rectification').val());
            var penalty = $.trim($currentEl.find('#penalty').val());
            var focus = $.trim($currentEl.find('#focus').val());
            var remark = $.trim($currentEl.find('#remark').val());

            var data = {
                engineerInfo : this.engineerInfoID,
                rule         : rule,
                inspector    : inspector,
                inspectDate  : inspectDate,
                rectification: rectification,
                penalty      : penalty,
                focus        : focus,
                remark       : remark,
                timeStamp    : this.timeStamp
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }


            model = new checkSituationModel();
            model.urlRoot = function () {
                return 'engineerInfo/checkSituation';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function (model) {
                    self.hideDialog();

                    var currentModel = model.changed.success;
                    self.sendToServer(null, currentModel);
                    if (self.eventChannel) {
                        self.eventChannel.trigger('checkSituationUpdated');
                    }
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        fileSizeIsAcceptable: function (file) {
            if (!file) {
                return false;
            }
            return file.size < App.File.MAXSIZE;
        },


        hideDialog: function () {
            $('.create-save-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var self = this;
            var $notDiv;
            var formString = self.template({
                inspectDate: this.inspectDate,
                inspector: this.inspector,
                content: this.content,
                penalty: this.penalty
            });

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'create-save-dialog',
                title        : 'Create checkSituation',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-checkSituation-dialog',
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
            var model = new managementRuleModel;
            this.attachView = new AttachView({
                model       : model,
                contentType : this.contentType,
                isCreate    : true
            });
            $notDiv.append(this.attachView.render().el);

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
