define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/contract/OutContract/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS,dataService) {

    var EditView = ParentView.extend({
        contentType: 'OutContract',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.OUTCONTRACT;
            this.responseObj['#sealType'] = [
                {
                    _id : 'GZ',
                    name: '公章'
                }, {
                    _id : 'HTZYZ',
                    name: '合同专用章'
                }

            ];
            this.responseObj['#preAmountType'] = [
                {
                    _id : 'HQHKZBZKC',
                    name: '后期货款中不做扣除'
                }, {
                    _id : 'SCFKZKC',
                    name: '首次付款中扣除'
                },
                {
                    _id : 'TBLKC',
                    name: '同比例扣除'
                },
                {
                    _id : 'WKZKC',
                    name: '尾款中扣除'
                }

            ];
            this.responseObj['#paymentType'] = [
                {
                    _id : 'DPAYAJE',
                    name: '单批按月,按金额'
                }, {
                    _id : 'DPAYASL',
                    name: '单批按月,按数量'
                },
                {
                    _id : 'DPAJDAJE',
                    name: '单批按节点,按金额'
                },
                {
                    _id : 'DPAJDASL',
                    name: '单批按节点,按数量'
                }

            ];
            this.responseObj['#payType'] = [
                {
                    _id : 'NDZF',
                    name: '年底支付'
                }, {
                    _id : 'AZWCZF',
                    name: '安装完成支付'
                },
                {
                    _id : 'YSHGZF',
                    name: '验收合格支付'
                },
                {
                    _id : 'ZBJ',
                    name: '质保金'
                }

            ];
            this.responseObj['#carriage'] = [
                {
                    _id : 'AJE',
                    name: '按金额'
                }, {
                    _id : 'ADHDD',
                    name: '按到货地点'
                }


            ];
            this.responseObj['#quota'] = [
                {
                    _id : 'ACL',
                    name: '按材料'
                }, {
                    _id : 'ADW',
                    name: '按单位'
                },
                {
                    _id : 'AJE',
                    name: '按金额'
                }
            ];

            this.render();
        },

        useProjectFilter: function (e) {
            var project;
            var filter;

            e.preventDefault();
            project = this.currentModel.get('project')._id;
            filter = {
                project: {
                    key  : 'project._id',
                    type : 'ObjectId',
                    value: [project]
                }
            };

            $('.edit-dialog').remove();

            Backbone.history.navigate('#easyErp/OutContract/list/p=1/c=100/filter=' + encodeURIComponent(JSON.stringify(filter)), {trigger: true});
        },

        isNumberKey: function (evt) {
            var charCode = (evt.which) ? evt.which : event.keyCode;

            return !(charCode > 31 && (charCode < 48 || charCode > 57));
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('dd').find('.current-selected');

            endElem.text(target.text()).attr('data-id', target.attr('id'));
            endElem.attr('data-shortdesc', target.data('level'));
        },

        saveItem: function (event) {
            var self = this;
            var holder;
            var mid;
            var project;
            var workflow;
            var data;
            var currentWorkflow;
            var currentProject;

            event.preventDefault();

            holder = this.$el;
            mid = 39;

            project = holder.find('#projectDd').data('id');

            workflow = holder.find('#workflowsDd').data('id');

            data = {

                sealType         : holder.find('#sealType').data('id'),
                preAmountType    : holder.find('#preAmountType').data('id'),
                paymentType      : holder.find('#paymentType').data('id'),
                payType          : holder.find('#payType').data('id'),
                carriage         : holder.find('#carriage').data('id'),
                quota            : holder.find('#quota').data('id'),
                description      : $.trim(holder.find('#descriptions').val()),
                respons          : $.trim(holder.find('#respons').val()),
                payTerm          : $.trim(holder.find('#payTerm').val()),
                payProp          : $.trim(holder.find('#payProp').val()),
                preAmount        : $.trim(holder.find('#preAmount').val()),
                taskAmount       : $.trim(holder.find('#taskAmount').val()),
                quality          : $.trim(holder.find('#quality').val()),
                violation        : $.trim(holder.find('#violation').val()),
                note             : $.trim(holder.find('#note').val()),
                supplier         : holder.find('#supplier').data('id'),
                signedDate       : $.trim(holder.find('#signedDate').val()),
                proDate          : $.trim(holder.find('#proDate').val()),
                workflow         :workflow

            };

            currentWorkflow = this.currentModel.get('workflow');

            if (currentWorkflow && currentWorkflow._id && (currentWorkflow._id !== workflow)) {
                data.workflow = workflow;
                data.sequence = -1;
                data.workflowStart = this.currentModel.toJSON().workflow._id;
            }

            currentProject = this.currentModel.get('project');

            if (currentProject && currentProject._id && (currentProject._id !== project)) {
                data.project = project;
            }

            if (holder.find('#workflowsDd').text() === 'Done') {
                data.progress = 100;
            }

            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {

                    self.hideDialog();

                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        deleteItem: function (event) {
            var mid;
            var self = this;
            var answer;

            event.preventDefault();

            mid = 39;
            answer = confirm('Really DELETE items ?!');

            if (answer === true) {
                this.currentModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function (model) {
                        var viewType;
                        var wId;
                        var newTotal;
                        var $totalCount;

                        model = model.toJSON();
                        viewType = custom.getCurrentVT();

                        switch (viewType) {
                            case 'list':
                                $("tr[data-id='" + model._id + "'] td").remove();
                                var url = window.location.hash;

                                Backbone.history.fragment = '';

                                Backbone.history.navigate(url, {trigger: true});
                                break;
                            case 'kanban':
                                $('#' + model._id).remove();
                                // count kanban
                                wId = model.workflow._id;
                                $totalCount = $('td#' + wId + ' .totalCount');

                                newTotal = ($totalCount.html() - 1);
                                $totalCount.html(newTotal);
                        }
                        self.hideDialog();
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
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
                        context.$el.find('#pmrId').val(pro.pmr._id);
                    }
                }, this);
            } else {
                this.$el.find('#descriptions').val('');
            }

        },

        render: function () {
            console.log(this.currentModel.toJSON())
            var formString = this.template({
                model: this.currentModel.toJSON()
            });
            var self = this;
            var notDiv;
            var inventoryModel=this.currentModel.toJSON();
            var ID=inventoryModel.project._id;
            this.selectProject(ID);
            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog  task-edit-dialog',
                width      : 800,
                title      : this.currentModel.toJSON().project.projectShortDesc,
                buttons    : {
                    save: {
                        text : '保存',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    },
                    delete: {
                        text : '删除',
                        class: 'btn',
                        click: self.deleteItem
                    }
                }
            });
            var $thisEl = this.$el;
            $thisEl.find('.attachments').append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: 'ContractTask'
                }).render().el
            );

            notDiv = this.$el.find('#divForNote');
            notDiv.append(
                new NoteView({
                    model      : this.currentModel,
                    contentType: 'Tasks'
                }).render().el);

            this.renderAssignees(this.currentModel);

            populate.get('#projectDd', '/projects/getForDd', {}, 'name', this);
            populate.getWorkflow('#workflowsDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {id: 'Projects'}, 'name', this);
            populate.get2name('#assignedToDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this);
            populate.get2name('#pmrDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this);
            populate.get2name('#supplier', CONSTANTS.URLS.CUSTOMERS, {}, this);
            populate.getPriority('#priorityDd', this);

            this.delegateEvents(this.events);

            this.$el.find('#StartDate').datepicker({dateFormat: 'd M, yy', minDate: new Date()});
            this.$el.find('#signedDate').datepicker({dateFormat: 'yy-MM-dd', monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']});
            this.$el.find('#proDate').datepicker({dateFormat: 'yy-MM-dd', monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']});

            // for input type number
            this.$el.find('#logged').spinner({
                min: 0,
                max: 1000
            });
            this.$el.find('#estimated').spinner({
                min: 0,
                max: 1000
            });

            return this;
        }

    });
    return EditView;
});
