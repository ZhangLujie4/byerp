define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Editor/AttachTemplate.html',
    'text!templates/Editor/AttachDocTemplate.html',
    'moment'
], function (Backbone, $, _, AttachTemplate, AttachDocTemplate, moment) {
    var AttachView = Backbone.View.extend({

        initialize: function (options) {
            this.contentType = options.contentType;
            this.isCreate = options.isCreate;
            this.elementId = options.elementId;
            this.forDoc = options.forDoc;
        },

        events: {
            'change .inputAttach': 'addAttach',
            'click .deleteAttach': 'deleteAttach'
        },

        template: _.template(AttachTemplate),
        docTemplate: _.template(AttachDocTemplate),

        addAttach: function (event) {
            var $thisEl = this.$el;
            var s;

            if (this.isCreate) {
                s = $thisEl.find('.inputAttach:last').val().split('\\')[$thisEl.find('.inputAttach:last').val().split('\\').length - 1];
                $thisEl.find('.attachContainer').append('<li class="attachFile">' +
                    '<span class="blue">' + s + '</span>' +
                    '<a href="javascript:;" class="deleteAttach">Delete</a></li>'
                );
                $thisEl.find('.attachContainer .attachFile:last').append($thisEl.find('.input-file .inputAttach').attr('hidden', 'hidden'));
                $thisEl.find('.input-file').append('<input type="file" value="Choose File" class="inputAttach" name="attachfile">');
            } else {
                this.sendToServer(event, null, this);
            }
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
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
                currentModelId = currentModel.id;

                $thisEl.find('li .inputAttach').each(function () {
                    addInptAttach = $(this)[0].files[0];
                    fileArr.push(addInptAttach);

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

        deleteAttach: function (e) {
            var self = this;
            var $target = $(e.target);
            var currentModel = this.model;
            var attachments = currentModel.get('attachments');
            var newAttachments;
            var fileName;
            var id;

            if (confirm('您确定要删除此文件吗?')) {
                $target = $(e.target);

                if ($target.closest('li').hasClass('attachFile')) {
                    $target.closest('.attachFile').remove();
                } else {
                    id = $target.attr('id');
                    newAttachments = _.filter(attachments, function (attach) {
                        if (attach._id !== id) {
                            return attach;
                        }
                    });

                    fileName = this.$el.find('.attachFile_' + id + ' a')[0].innerHTML;
                    currentModel.save({attachments: newAttachments, fileName: fileName},
                        {
                            headers: {
                                mid: 39
                            },
                            patch  : true, // Send only changed attr(add Roma)
                            success: function () {
                                var othersAttaches;

                                self.$el.find('.attachFile_' + id).remove();
                                othersAttaches = self.$el.find('.attachContainer li').length;

                                if (!othersAttaches){
                                    self.$el.find('.input-file').removeClass('smallBtn');
                                }


                            }
                        });
                }
            }
        },

        render: function () {
            var attachments = this.model.get('attachments');
            var optionObj = {
                attachments: attachments,
                elementId  : this.elementId || 'addAttachments',
                moment     : moment
            };

            if (this.forDoc){
                this.$el.html(this.docTemplate(optionObj));
            } else {
                this.$el.html(this.template(optionObj));

            }



            return this;
        }
    });

    return AttachView;
});
