define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/Opportunities/CreateTemplate.html',
    'models/OpportunitiesModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'constants'
], function (Backbone, _, $, ParentView, CreateTemplate, OpportunityModel, common, populate, dataService, AttachView, CONSTANTS) {
    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'Opportunities',
        template   : _.template(CreateTemplate),

        initialize: function (options) {
            options = options || {};

            _.bindAll(this, 'saveItem');

            this.parentModel = options.parentModel;
            this.responseObj = {};
            this.elementId = options.elementId || null;

            this.render();
        },
        events    : {
            'click .icon-attach': 'clickInput'
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        keydownHandler: function (e) {
            switch (e.which) {
                case 27:
                    this.hideDialog();
                    break;
                default:
                    break;
            }
        },

        saveItem: function () {
            var mid = 25;
            var opportunityModel = new OpportunityModel();
            var $thisEl = this.$el;
            var name = $.trim($thisEl.find('#name').val());
            var expectedRevenueValue = $.trim($thisEl.find('#expectedRevenueValue').val()) || '0';
            var expectedRevenue;
            var companyId = $thisEl.find('#companyDd').attr('data-id');
            var customerId = $thisEl.find('#customerDd').attr('data-id');
            var salesPersonId = $thisEl.find('#salesPersonDd').attr('data-id');
            var expectedClosing = $.trim($thisEl.find('#expectedClosing').val());
            var priority = $.trim($thisEl.find('#priorityDd').text());
            var internalNotes = $.trim($thisEl.find('#internalNotes').val());
            //var address = {};
            var workflow = $thisEl.find('#workflowDd').data('id');
            var self = this;
            var usersId = [];
            var groupsId = [];
            var whoCanRW = $thisEl.find("[name='whoCanRW']:checked").val();

            var archPersonId = $thisEl.find('#archPersonDd').attr('data-id');
            var archNumber = $.trim($thisEl.find('#archNumber').val());
            var street = $.trim($thisEl.find('#street').val());
            var winDate = $.trim($thisEl.find('#winDate').val());
            var archDate = $.trim($thisEl.find('#archDate').val());
            var biderDate = $.trim($thisEl.find('#biderDate').val());
            var openDate = $.trim($thisEl.find('#openDate').val());
            var retDate = $.trim($thisEl.find('#retDate').val());
            var address = {
                street   : street
            };
            var archerDate = {
                winDate  : winDate,
                archDate : archDate
            };
            var leadDate = {                
                retDate     : retDate,
            };

            $('dd').find('.address').each(function () {
                var el = $(this);

                address[el.attr('name')] = el.val();
            });

            $('.groupsAndUser tr').each(function () {
                if ($(this).data('type') === 'targetUsers') {
                    usersId.push($(this).data('id'));
                }
                if ($(this).data('type') === 'targetGroups') {
                    groupsId.push($(this).data('id'));
                }

            });

            if (expectedRevenueValue) {
                expectedRevenue = {
                    value   : expectedRevenueValue,
                    currency: '$'
                };
            }

            opportunityModel.save(
                {
                    name           : name,
                    expectedRevenue: expectedRevenue,
                    customer       : customerId || null,
                    salesPerson    : salesPersonId || null,
                    expectedClosing: expectedClosing,
                    priority       : priority,
                    company        : companyId,
                    workflow       : workflow,
                    internalNotes  : internalNotes,
                    address        : address,
                    whoCanRW       : whoCanRW,
                    archPerson     : archPersonId || null,
                    archNumber     : archNumber,
                    archerDate     : archerDate,
                    leadDate       : leadDate,
                    biderDate      : biderDate,
                    openDate       : openDate,
                    address        : address,
                    groups         : {
                        owner: self.$el.find('#allUsersSelect').attr('data-id') || null,
                        users: usersId,
                        group: groupsId
                    },

                },
                {   
                    validate: false,
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
                }
            );
        },

        render: function () {
            var parentModel = this.parentModel ? this.parentModel.toJSON() : '';
            var formString = this.template({parentModel: parentModel});
            var self = this;
            var notDiv;
            var model = new OpportunityModel();

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : '450px',
                title        : 'Create Opportunity',
                buttons      : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
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

            notDiv = this.$el.find('.attach-container');

            this.attachView = new AttachView({
                model      : model,
                contentType: self.contentType,
                isCreate   : true
            });

            notDiv.append(this.attachView.render().el);
            /* this.renderAssignees(model);*/

            this.$el.find('#expectedClosing').datepicker({dateFormat: 'd M, yy', minDate: new Date()});
            dataService.getData('/opportunities/priority', {}, function (priorities) {
                priorities = _.map(priorities.data, function (priority) {
                    priority.name = priority.priority;

                    return priority;
                });
                self.responseObj['#priorityDd'] = priorities;
            });
            populate.get2name('#customerDd', CONSTANTS.URLS.CUSTOMERS, {type: 'Person'}, this);
            populate.get2name('#companyDd', CONSTANTS.URLS.CUSTOMERS, {type: 'Company'}, this);
            dataService.getData('/employees/getForDD', {isEmployee: true}, function (employees) {
                employees = _.map(employees.data, function (employee) {
                    employee.name = employee.name.first + ' ' + employee.name.last;

                    return employee;
                });

                self.responseObj['#salesPersonDd'] = employees;
            });

            populate.getWorkflow('#workflowDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {id: 'Opportunities'}, 'name', this, true);
            populate.get('#salesTeamDd', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, true, true);
            populate.get('#sourceDd', '/employees/sources', {}, 'name', this);

            this.$el.find('#winDate').datepicker({
                dateFormat: 'yy-MM-dd',
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });
            this.$el.find('#archDate').datepicker({
                dateFormat: 'yy-MM-dd',
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });
            this.$el.find('#biderDate').datepicker({
                dateFormat: 'yy-MM-dd',
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });
            this.$el.find('#openDate').datepicker({
                dateFormat: 'yy-MM-dd',
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });
            this.$el.find('#retDate').datepicker({
                dateFormat: 'yy-MM-dd',
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });

            this.delegateEvents(this.events);
            return this;
        }

    });

    return CreateView;
});
