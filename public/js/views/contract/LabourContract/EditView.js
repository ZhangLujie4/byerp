define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/contract/LabourContract/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'text!templates/contract/LabourContract/taskInfo/inventory.html',
    'text!templates/contract/LabourContract/taskInfo/inventoryEdit.html',
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
             CONSTANTS,
             inventorys,
             inventoryEdit,dataService) {

    var EditView = ParentView.extend({
        contentType: 'LabourContract',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated  ': 'isNumberKey',
            'click #projectTopName'         : 'useProjectFilter',
            'click .addItem a'              : 'getItem',
            'click .removeItem'             : 'deleteRow'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();

            this.currentModel.urlRoot = CONSTANTS.URLS.LABOURCONTRACT;
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

            Backbone.history.navigate('#easyErp/LabourContract/list/p=1/c=100/filter=' + encodeURIComponent(JSON.stringify(filter)), {trigger: true});
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
        getItem:function(e){
            var target = $(e.target);
            var $parrent = target.closest('tbody');
            var templ = _.template(inventorys);
            var $trEll = $parrent.find('tr.inventoryItem');
            e.preventDefault();
            e.stopPropagation();
            if(!$trEll.length){
                $parrent.prepend(templ({}));
            }
            $($trEll[$trEll.length - 1]).after(templ({}));
            return false;
        },
        deleteRow: function (e){
            var target = $(e.target);
            var tr = target.closest('tr');
            tr.remove();

        },

        saveItem: function (event) {
            var self = this;
            var holder;
            var mid;
            var assignedTo;
            var workflow;
            var data;
            event.preventDefault();


            holder = this.$el;
            mid = 39;
            assignedTo = holder.find('#assignedToDd').data('id');
            var taskAmount = $.trim(holder.find('#taskAmount').val());
            var signedDate= $.trim(holder.find('#signedDate').val());
            workflow = holder.find('#workflowsDd').data('id');

            var thisEl = this.$el;
            var selectedinventory = thisEl.find('.inventoryItem');
            var inventory=[];
            var selectedLength = selectedinventory.length;
            var targetEl;
            var i;
            for (i = selectedLength - 1; i >= 0; i--) {
                targetEl = $(selectedinventory[i]);
                var finishData=targetEl.find('[data-name="finishData"] input').val();
                var items=targetEl.find('[data-name="items"] input').val();
                var subitems=targetEl.find('[data-name="subitems"] input').val();
                var units=targetEl.find('[data-name="unit"] input').val();
                var amount=targetEl.find('[data-name="amount"] input').val();
                var price=targetEl.find('[data-name="price"] input').val();
                var money=targetEl.find('[data-name="money"] input').val();
                var notes=targetEl.find('[data-name="notes"] input').val();

                inventory.push({
                    finishData      :finishData,
                    items           :items,
                    subitems        :subitems,
                    unit            :units,
                    amount          :amount,
                    price           :price,
                    money           :money,
                    notes           :notes
                });
            }


            data = {

                assignedTo      : assignedTo,
                taskAmount      : $.trim(holder.find('#taskAmount').val()),
                quality         : $.trim(holder.find('#quality').val()),
                violation       : $.trim(holder.find('#violation').val()),
                note            : $.trim(holder.find('#noted').val()),
                inventory       : inventory,
                workflow        : workflow,
                signedDate      : $.trim(holder.find('#signedDate').val())
            };

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
                    }
                }, this);
            } else {
                this.$el.find('#descriptions').val('');
            }

        },
        render: function () {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });
            var self = this;
            var notDiv;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog  task-edit-dialog',
                width      : 1100,
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


            var inventoryE;
            var $thisEl = this.$el;
            var inventoryContainer;
            var inventoryModel=this.currentModel.toJSON();
            var ID=inventoryModel.project._id;
            this.selectProject(ID);

            if (inventoryModel.inventory) {
                inventoryE = inventoryModel.inventory;
                if (inventoryE) {
                    inventoryContainer = $thisEl.find('#inventoryList');
                    inventoryContainer.append(_.template(inventoryEdit, {
                        inventory        : inventoryE

                    }));

                }
            }

            $thisEl.find('.attachments').append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: 'LabourContract'
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
            populate.get2name('#assignedToDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this,false, true);
            populate.get2name('#pmrDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this);
            populate.get2name('#customerDd', CONSTANTS.URLS.CUSTOMERS, {}, this);
            populate.getPriority('#priorityDd', this);

            this.delegateEvents(this.events);

            this.$el.find('#signedDate').datepicker({dateFormat: 'yy-MM-dd', monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']});

            // for input type number


            return this;
        }

    });
    return EditView;
});
