define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/contract/InternalContract/CreateTemplate.html',
    'models/InternalContractModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, TaskModel, common, populate, AttachView, SelectView, CONSTANTS,dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'InternalContract',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
            'change #workflowNames': 'changeWorkflows'
        },


        initialize: function () {


            _.bindAll(this, 'saveItem', 'render');
            this.model = new TaskModel();

            this.render();
        },

        addAttach: function () {
            var $inputFile = this.$el.find('.input-file');
            var $attachContainer = this.$el.find('.attachContainer');
            var $inputAttach = this.$el.find('.inputAttach:last');
            var s = $inputAttach.val().split('\\')[$inputAttach.val().split('\\').length - 1];

            $attachContainer.append('<li class="attachFile">' +
                '<a href="javascript:;">' + s + '</a>' +
                '<a href="javascript:;" class="deleteAttach">Delete</a></li>'
            );

            $attachContainer.find('.attachFile:last').append($inputFile.find('.inputAttach').attr('hidden', 'hidden'));
            $inputFile.append('<input type="file" value="Choose File" class="inputAttach" name="attachfile">');
        },

        deleteAttach: function (e) {
            $(e.target).closest('.attachFile').remove();
        },

        fileSizeIsAcceptable: function (file) {
            if (!file) {
                return false;
            }
            return file.size < App.File.MAXSIZE;
        },

        getWorkflowValue: function (value) {
            var workflows = [];
            var i;

            for (i = 0; i < value.length; i++) {
                workflows.push({name: value[i].name, status: value[i].status, _id: value[i]._id});
            }

            return workflows;
        },

        showDatePicker: function () {
            var $createDatePicker = $('.createFormDatepicker');

            if ($createDatePicker.find('.arrow').length === 0) {
                $createDatePicker.append('<div class="arrow"></div>');
            }
        },

        saveItem: function () {
            var self = this;
            var mid = 39;
            var thisEl = this.$el;




            var project = this.$el.find('#projectDd').data('id');
            var description = $.trim(this.$el.find('#descriptions').val());
            var taskAmount = $.trim(this.$el.find('#taskAmount').val());

            var deductedTax = $.trim(this.$el.find('#deductedTax').val());
            var adminFee = $.trim(this.$el.find('#adminFee').val());
            var depositCash = $.trim(this.$el.find('#depositCash').val());
            var note = $.trim(this.$el.find('#note').val());
            var signedDate = $.trim(this.$el.find('#signedDate').val());
            var workflow = this.$el.find('#workflowsDd').data('id');

            if(!project){
                return App.render({
                    type   : 'error',
                    message: '请选择工程!'
                })
            }
            if( !taskAmount ){
                return App.render({
                    type   : 'error',
                    message: '请填写合同金额!'
                })
            }
            if( !signedDate){
                return App.render({
                    type   : 'error',
                    message: '请填写合同签订日期!'
                })
            }
            this.model.save(
                {


                    workflow   : workflow,
                    project    : project ,
                    description: description,
                    taskAmount : taskAmount,
                    deductedTax: deductedTax,
                    adminFee   : adminFee,
                    depositCash: depositCash,
                    note       : note,
                    signedDate : signedDate
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        var currentModel = model.changed;

                        self.attachView.sendToServer(null, currentModel);
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        chooseOption: function (e) {
            var holder = $(e.target).parents('._modalSelect').find('.current-selected');
            holder.text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
            if (holder.attr('id') === 'projectDd') {
                this.selectProject($(e.target).attr('id'));
            }

        },
        selectProject: function (id) {

            if (id !== '') {
                dataService.getData( CONSTANTS.URLS.PROJECTS_GET_FOR_WTRACK, {
                    _id: id
                }, function (response, context) {
                    var project = response;
                    if (project) {
                        var pro=project.data[0];
                        context.$el.find('#descriptions').val(pro.projectShortDesc);
                        context.$el.find('#pmrDd').val(pro.pmr.name.first+' '+pro.pmr.name.last);
                        context.$el.find('#customerDd').val(pro.customer.name.first+' '+pro.customer.name.last);
                        context.$el.find('#pmrId').val(pro.pmr._id);
                        context.$el.find('#customerId').val(pro.customer._id);
                    }
                }, this);
            } else {
                this.$el.find('#descriptions').val('');
            }

        },

        render: function () {
            var afterPid = (window.location.hash).split('pId=')[1];
            var forKanban = (window.location.hash).split('kanban/')[1];
            var projectID = afterPid ? afterPid.split('/')[0] : forKanban;
            var formString = this.template();
            var self = this;
            var notDiv;
            var filterHash;
            var filter;
            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog task-edit-dialog',
                width        : 800,
                title        : 'Create Task',
                buttons      : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }
            });

            notDiv = this.$el.find('.attach-container');

            this.attachView = new AttachView({
                model      : new TaskModel(),
                contentType: self.contentType,
                isCreate   : true
            });

            if (!projectID) {
                filterHash = window.location.hash.split('filter=');
                filter = filterHash && filterHash.length > 1 ? JSON.parse(decodeURIComponent(filterHash[1])) : null;

                if (filter && filter.project) {
                    projectID = filter.project.value[0];
                }
            }

            notDiv.append(this.attachView.render().el);

            if (projectID) {
                populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, false, false, projectID);
            } else {
                populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, false, false);
            }

            populate.getWorkflow('#workflowsDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {id: 'Tasks'}, 'name', this, true);


            this.$el.find('#signedDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
