define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Editor/ApprovalEditorTemplate.html',
    'text!templates/Editor/ApprovaltimeTemplate.html',
    'text!templates/Editor/editNote.html',
    'models/DealTasksModel',
    'views/DealTasks/EditView',
    'views/selectView/selectView',
    'views/Category/TagView',
    'moment',
    'populate',
    'constants'
], function (Backbone, $, _, NoteTemplate, timelineTemplate, editNote, TaskModel, EditView, SelectView, CategoryView, moment, populate, CONSTANTS) {
    'use strict';

    var NoteView = Backbone.View.extend({

        template        : _.template(NoteTemplate),
        timeLineTemplate: _.template(timelineTemplate),

        initialize: function (options) {
            this.contentType = options.contentType;
            this.needNotes = options.hasOwnProperty('needNotes') ? options.needNotes : true;
            this.responseObj = {};
            this.taskModel = new TaskModel();
            this.taskModel.on('change:category', this.renderCategory, this);
        },

        events: {
            'click #noteArea, #taskArea'                       : 'expandNote',
            'click .cancelNote, #cancelTask'                   : 'cancelNote',
            'click #addNote, .saveNote'                        : 'saveNote',
            'click .contentHolder'                             : 'showButtons',
            'click #addTask'                                   : 'saveTask',
            'click .fa-circle-o'                               : 'completeTask',
            'click .editDelNote'                               : 'editDelNote',
            'click .icon-attach'                               : 'clickInput',
            'click .chart-tabs li'                             : 'changeTab',
            'click .current-selected:not(.jobs)'               : 'showNewSelect',
            'click .newSelectList li:not(.miniStylePagination)': 'chooseOption'
        },

        showButtons: function (e) {

            var target = $(e.target);
            var $target = target.closest('.contentHolder');
            var hasClass = $target.hasClass('showButtons');
            var $thisEl = this.$el;

            if (target.closest('.itemCircle').length) {
                return false;
            }

            if ($thisEl.find('.editedNote').length || $thisEl.find('.createHolder').hasClass('active')) {
                return false;
            }

            $thisEl.find('.contentHolder').removeClass('showButtons');
            if (!hasClass) {
                $target.addClass('showButtons');
            }
        },

        expandNote: function (e) {
            var $target = $(e.target);
            var createHolder = $target.parents('.createHolder');

            if (this.$el.find('.editedNote').length) {
                return false;
            }
            if (!createHolder.hasClass('active')) {
                createHolder.addClass('active');
            }
        },

        completeTask: function (e) {
            var $target = $(e.target);
            var self = this;
            var $thisEl = this.$el;
            var id = $target.closest('.noteContainer').attr('id');
            var model = new TaskModel({_id: id});
            model.fetch();
            model.on('sync', function (success) {

                model.save({
                    workflow     : CONSTANTS.DONE_WORKFLOW,
                    sequence     : -1,
                    workflowStart: model.get('workflow')._id,
                    sequenceStart: model.get('sequence')
                }, {
                    wait    : true,
                    patch   : true,
                    validate: false,
                    success : function () {
                        $target.switchClass('fa-circle-o', 'fa-check-circle-o');
                        model.unbind();

                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
            });

        },

        saveTask: function () {
            var self = this;
            var $thisEl = this.$el;
            var assignedTo = $thisEl.find('#assignedToDd').attr('data-id');
            var $description = $thisEl.find('#taskArea');
            var description = $.trim($description.val());
            var dueDate = $.trim($thisEl.find('#taskDueDate').val());
            var time = moment($.trim($thisEl.find('#timepickerOne').wickedpicker('time')).split(' '), 'hh:mm:ss A');

            if (dueDate) {
                dueDate = moment(dueDate).hours(time.get('hours')).minutes(time.get('minutes')).seconds(time.get('seconds')).toDate();
            }
            var saveObject = {
                assignedTo : assignedTo || '',
                description: description,
                dueDate    : dueDate,
                workflow   : CONSTANTS.NOT_STARTED_WORKFLOW,
                category   : this.taskModel.get('category') ? this.taskModel.get('category')._id : null
            };

            switch (this.contentType) {
                case 'Persons':
                    saveObject.contact = this.model.id;
                    saveObject.contactDate = new Date();
                    break;
                case 'Companies':
                    saveObject.company = this.model.id;
                    saveObject.companyDate = new Date();
                    break;
                case 'Opportunities':
                    saveObject.deal = this.model.id;
                    saveObject.dealDate = new Date();
                    break;
            }

            if (!description) {
                return App.render({
                    type   : 'error',
                    message: '请添加描述'
                });
            }

            this.taskModel.save(saveObject, {
                wait   : true,
                success: function () {
                    self.model.fetch({
                        success: function () {
                            self.taskModel = new TaskModel();
                            self.taskModel.on('change:category', self.renderCategory, self);
                            $thisEl.find('#taskArea').val('');
                            $thisEl.find('.createHolder').removeClass('active');
                            self.renderTimeline();
                            self.renderCategory();
                        }
                    });
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }

            });
        },

        clickInput: function () {
            $('.input-file .inputAttach').click();
        },

        showNewSelect: function (e) {
            var $target = $(e.target);

            e.stopPropagation();

            if ($target.attr('id') === 'selectInput') {
                return false;
            }

            if (this.selectView) {
                this.selectView.remove();
            }

            this.selectView = new SelectView({
                e          : e,
                responseObj: this.responseObj
            });

            $target.append(this.selectView.render().el);

            return false;
        },

        editNote: function (currentNote) {
            var holder = this.$el.find('#' + currentNote._id);
            holder.find('.contentHolder').hide();
            holder.append(_.template(editNote, {note: currentNote}));
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.closest('a');
            var id = $target.attr('id');
            holder.text($target.text()).attr('data-id', id);
        },

        editDelNote: function (e) {
            var $target = $(e.target);

            var type = $target.attr('data-type');
            var idInt = $target.closest('.noteContainer').attr('id');
            var currentModel = this.model;
            var notes = currentModel.get('notes');
            var newNotes;
            var model;

            var currentNote = _.filter(notes, function (note) {
                if (note._id === idInt) {
                    return note;
                }
            })[0];

            if (currentNote.task) {
                model = new TaskModel();
                model.set(model.parse(currentNote.task));
            }

            switch (type) {
                case 'edit':

                    if (model) {
                        new EditView({model: model});
                    } else {
                        this.editNote(currentNote);
                    }

                    break;
                case 'del':

                    if (model && confirm('你确定要移除任务? ')) {
                        model.destroy({
                            success: function () {
                                $('#' + idInt).remove();
                            }
                        });

                    } else {
                        newNotes = _.filter(notes, function (note) {
                            if (note._id !== idInt && !note.task && !note.history) {
                                return note;
                            }
                        });

                        if (confirm('你确定要移除备注吗? ')) {
                            currentModel.save({notes: newNotes},
                                {
                                    headers: {
                                        mid   : 39,
                                        remove: true
                                    },
                                    patch  : true,
                                    success: function () {
                                        $('#' + idInt).remove();
                                    }
                                });
                        }
                    }

                    break;
            }
        },

        changeTab: function (e) {
            var target = $(e.target);
            var $aEllement = target.closest('a');
            var n;
            var dialogHolder;

            target.closest('.chart-tabs').find('a.active').removeClass('active');
            $aEllement.addClass('active');
            n = target.parents('.chart-tabs').find('li').index($aEllement.parent());
            dialogHolder = this.$el.find('.dialog-tabs-items');
            dialogHolder.find('.dialog-tabs-item.active').removeClass('active');
            dialogHolder.find('.dialog-tabs-item').eq(n).addClass('active');
        },

        cancelNote: function (e) {
            var $target = $(e.target);
            var $addNote = $target.closest('.addNote');
            var contentHolder = $target.closest('.noteContainer');
            if (contentHolder.length) {
                contentHolder.find('.contentHolder').show();
                contentHolder.find('.contentHolder').removeClass('showButtons');
                $addNote.remove();
            } else {
                $addNote.find('#noteArea').val('');
                $target.parents('.createHolder').removeClass('active');
                $target.parents('.addTask').find('#taskArea').val('');
            }
        },

        saveNote: function (e) {
            //console.log('save Note');
            var self = this;
            var $target = $(e.target);
            var $noteArea = $target.parents('.addNote').find('#noteArea');
            /* var $noteTitleArea = $target.parents('.addNote').find('#noteTitleArea');*/
            var $noteContainer = $target.closest('.noteContainer');
            var targetId = $noteContainer.attr('id');
            var $thisEl = this.$el;
            var val;
            var title;
            var formModel;
            var notes;
            var editNotes;
            var noteObj;

            if ($noteArea.val().replace(/ /g, '') /*|| $noteTitleArea.val().replace(/ /g, '')*/) {
                $noteArea.attr('placeholder', '添加一个备注...').parents('.addNote').removeClass('active');
                $thisEl.find('.title-wrapper').hide();
                $thisEl.find('.addTitle').hide();
            } else {
                $noteArea.focus();
            }

            e.preventDefault();
            val = $.trim($noteArea.val()).replace(/</g, '&#60;').replace(/>/g, '&#62;');
            /*  title = $.trim($noteTitleArea.val()).replace(/</g, '&#60;').replace(/>/g, '&#62;');*/

            if (!val /*&& !title*/) { // textarrea notes not be empty
                return App.render({
                    type   : 'error',
                    message: '注释不能为空'
                });
            }
            if (val.replace(/ /g, '') /*|| title.replace(/ /g, '')*/) {
                formModel = this.model;
                notes = formModel.get('notes');
                notes = notes.filter(function (elem) {
                    return !elem.task && !elem.history;
                });
                noteObj = {};
                if (targetId) {
                    editNotes = _.map(notes, function (note) {
                        if (note._id === targetId) {
                            note.note = val;
                            /*   note.title = title;*/
                        }
                        return note;
                    });
                    formModel.save({notes: editNotes},
                        {
                            validate: false,
                            headers : {
                                mid : 39,
                                edit: true
                            },

                            patch  : true,
                            success: function () {
                                var $contentHolder = $noteContainer.find('.contentHolder');
                                $contentHolder.removeClass('showButtons');
                                /*  $contentHolder.find('.noteTitle').text(title);*/
                                $contentHolder.find('.noteText').text(val).removeClass('hidden');
                                $contentHolder.show();
                                $target.closest('.addNote').remove();

                                /*console.log('note is changed 1');
                                 $noteArea.html('');*/
                            }
                        });
                } else {
                    noteObj.note = val;
                    notes.push(noteObj);
                    formModel.save({notes: notes}, {
                        headers : {
                            mid: 39
                        },
                        patch   : true,
                        validate: false,
                        wait    : true,
                        success : function () {
                            var formLeftColumn = self.$el.find('.formLeftColumn');
                            var noteWrapper = formLeftColumn.find('.noteWrapper');

                            noteWrapper.empty();
                            formLeftColumn.append(self.render());

                            /*console.log('note is changed 2');
                             $noteArea.html('');*/
                        },

                        error: function (models, xhr) {
                            self.errorNotification(xhr);

                        }
                    });
                }
            } else {
                return false;
            }

        },

        /*  showTitle: function (e) {

         $(e.target).hide().parents('.addNote').find('.title-wrapper').show().find('input').focus();
         },*/

        renderTimeline: function () {
            var notes = this.model.get('notes');

            //console.log(notes);

            this.$el.find('#timeline').html(_.template(timelineTemplate, {notes: notes}));
        },

        renderCategory: function () {
            var arrType = ['AM', 'PM'];
            var notDiv = this.$el.find('#categoryHolder');

            notDiv.html(
                new CategoryView({
                    model      : this.taskModel,
                    contentType: 'DealTasks'
                }).render().el
            );
            /*this.$el.find('#taskDueDate').datepicker({
                dateFormat : 'd M, yy',
                changeMonth: true,
                changeYear : true
            });*/
            this.$el.find('#taskDueDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
            });
        },

        render: function () {
            var modelObj = this.model.toJSON();
            /*var date = moment().format("DD MMM, YYYY");*/
            var date = moment().format("YYYY-MM-DD");
            var assignedTo = modelObj.salesPerson;
            var $thisEl = this.$el;
            var relatedEmployeeId = App.currentUser.relatedEmployee ? App.currentUser.relatedEmployee._id : null;

            modelObj.needNotes = this.needNotes;

            $thisEl.html(this.template({date: date, assignedTo: assignedTo}));

            this.renderTimeline();

            this.renderCategory();
            this.$el.find('#timepickerOne').wickedpicker({
                showSeconds    : true, //Whether or not to show seconds,
                secondsInterval: 1, //Change interval for seconds, defaults to 1,
                minutesInterval: 1
            });

            populate.get2name('#assignedToDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false, relatedEmployeeId);

            return this;
        }
    });

    return NoteView;
});
