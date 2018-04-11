define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/Projects/CreateTemplate.html',
    'models/ProjectsModel',
    'views/Notes/AttachView',
    'views/Bonus/BonusView',
    'services/projects',
    'populate',
    'custom',
    'constants',
    'dataService',
    'common'
], function (Backbone, $, _, ParentView, CreateTemplate, ProjectModel, AttachView, BonusView, projects, populate, customFile, CONSTANTS,dataService,common) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'Projects',
        template   : _.template(CreateTemplate),

        initialize: function () {
            _.bindAll(this, 'saveItem');
            this.model = new ProjectModel();
            this.responseObj = {};
            this.responseObj['#sealType'] = [
                {
                    _id : 'GZ',
                    name: '公章'
                }, {
                    _id : 'HTZYZ',
                    name: '合同专用章'
                }

            ];
            this.responseObj['#projectType'] = [
                {
                    _id : 'GSXM',
                    name: '公司项目'
                }, {
                    _id : 'GKXM',
                    name: '挂靠项目'
                }, {
                    _id : 'HZXM1',
                    name: '合作项目1'
                }, {
                    _id : 'HZXM2',
                    name: '合作项目2'
                }, {
                    _id : 'HZXM3',
                    name: '合作项目3'
                }
            ];
            this.render();
        },

        events: {
            'click #workflowNamesDd' : 'chooseUser',
            'submit form'            : 'formSubmitHandler',
            'click #health a'        : 'showHealthDd',
            'click #health ul li div': 'chooseHealthDd',
            'click #lead'             : 'chooseLead'
        },

        hideHealth: projects.hideHealth,

        chooseOption: function (e) {
            $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));

            this.hideHealth();
        },

        chooseLead:function (e) {
            var $thisEl = this.$el;
            var lead = $thisEl.find('#lead').attr('data-id');
            if(lead){
                dataService.getData('opportunities/'+lead,{},function (result,context) {
                    var lead=result;
                    $thisEl.find('#projectName').val(lead.name);
                })
            }

        },

        chooseHealthDd: function (e) {
            $(e.target).parents('#health').find('a').attr('class', $(e.target).attr('class')).attr('data-value', $(e.target).attr('class').replace('health', '')).parent().find('ul').toggle();
        },

        showHealthDd: function (e) {
            $(e.target).parent().find('ul').toggle();
            return false;
        },

        formSubmitHandler: function (event) {
            event.preventDefault();
        },

        saveItem: function () {
            var self = this;
            var $thisEl = this.$el;
            var value;
            var mid = 39;
            var validation = true;
            var custom = $thisEl.find('#customerDd').text();
            var pmr = $thisEl.find('#pmr').attr('data-id');
            var pmv=$thisEl.find('#pmv').attr('data-id')||null;
            var customer = $thisEl.find('#customerDd').attr('data-id');
            var projecttype = $thisEl.find('#projectTypeDD').data('id');
            var workflow = $thisEl.find('#workflowsDd').data('id');
            var paymentMethod = $thisEl.find('#paymentMethod').data('id') ||null;
            var paymentTerms = $thisEl.find('#paymentTerms').data('id')||null;
            var description;
            var response;
            var violation;
            var $userNodes;
            var users = [];
            var bonusContainer = $('#bonusTable'); // todo change it to this.$el;
            var bonusRow = bonusContainer.find('tr');
            var bonus = [];
            var usersId = [];
            var groupsId = [];
            var whoCanRW;
            var health;
            var startDate;
            var targetEndDate;
            var signedDate;
            var archDate;
            var quality;

            /*if (custom === 'Select') {
                value = 'Customer';
                return App.render({
                    type   : 'error',
                    message: 'Please, choose ' + value + ' first.'
                });
            } else if (!paymentMethod) {
                value = 'Bank Account in Other Info tab';
                return App.render({
                    type   : 'error',
                    message: 'Please, choose ' + value + ' first.'
                });
            }*/
            var projectName=$.trim(this.$el.find('#projectName').val());

            if (!custom) {
                return App.render({
                    type   : 'error',
                    message: '请选择建设单位！'
                });
            }
            if (!pmr) {
                return App.render({
                    type   : 'error',
                    message: '请选择项目经理！'
                });
            }
            if (!projectName) {
                return App.render({
                    type   : 'error',
                    message: '请填写工程名称！'
                });
            }

            bonusRow.each(function () {
                var $currentEl = $(this);
                var employeeId = $currentEl.find("[data-content='employee']").attr('data-id');
                var bonusId = $currentEl.find("[data-content='bonus']").attr('data-id');
                var startDate;
                var endDate;

                if (!employeeId || !bonusId || custom === 'Select') {
                    validation = false;
                }

                startDate = $currentEl.find('.startDate input').val();
                endDate = $currentEl.find('.endDate input').val();

                bonus.push({
                    employeeId: employeeId,
                    bonusId   : bonusId,
                    startDate : startDate,
                    endDate   : endDate
                });
            });

            if (!validation) {
                return App.render({
                    type   : 'error',
                    message: 'Employee and bonus fields must not be empty.'
                });
            }

            description = $.trim(this.$el.find('#description').val());
            response = $.trim(this.$el.find('#response').val());
            violation = $.trim(this.$el.find('#violation').val());
            quality=$.trim(this.$el.find('#quality').val());
            $userNodes = this.$el.find('#usereditDd option:selected');
            $userNodes.each(function (key, val) {
                users.push({
                    id  : val.value,
                    name: val.innerHTML
                });
            });

            $thisEl.find('.groupsAndUser tr').each(function () {
                if ($(this).data('type') === 'targetUsers') {
                    usersId.push($(this).data('id'));
                }
                if ($(this).data('type') === 'targetGroups') {
                    groupsId.push($(this).data('id'));
                }

            });
            whoCanRW = this.$el.find("[name='whoCanRW']:checked").val();
            health = this.$el.find('#health a').data('value');
            startDate = $.trim(this.$el.find('#StartDate').val());
            targetEndDate = $.trim(this.$el.find('#EndDateTarget').val());
            signedDate = $.trim(this.$el.find('#signedDate').val());
            archDate = $.trim(this.$el.find('#archDate').val());

            if (validation) {
                this.model.save({
                    name                 : projectName,
                    lssArea              : $.trim(this.$el.find('#lssArea').val()),
                    payProp              : $.trim(this.$el.find('#payProp').val()),
                    amount               : $.trim(this.$el.find('#amount').val()),
                    preAmount            : $.trim(this.$el.find('#preAmount').val()),
                    payTerms             : $.trim(this.$el.find('#payTerms').val()),
                    pmr                  : pmr,
                    pmv                  : pmv,
                    quality              : quality,
                    proDate              : $.trim(this.$el.find('#proDate').val()),
                    sealType             : $.trim(this.$el.find('#sealType').data('id')),
                    lead                 : $.trim(this.$el.find('#lead').data('id')),
                    projectShortDesc     : $.trim(this.$el.find('#projectShortDesc').val()),
                    customer             : customer || '',
                    workflow             : workflow || '',
                    projecttype          : projecttype || '',
                    paymentMethod        : paymentMethod,
                    paymentTerms         : paymentTerms,
                    description          : description,
                    response             : response,
                    violation            : violation,
                    groups          : {
                        owner: self.$el.find('#allUsersSelect').attr('data-id') || null,
                        users: usersId,
                        group: groupsId
                    },

                    whoCanRW             : whoCanRW,
                    health               : health,
                    StartDate            : startDate,
                    TargetEndDate        : targetEndDate,
                    signedDate           : signedDate,
                    archDate             : archDate,
                    bonus                : bonus,
                    settlementTerms      : $.trim(this.$el.find('#settlementTerms').val()),
                    projectType          : $.trim(this.$el.find('#projectType').data('id')),
                    archiveMan           : $.trim(this.$el.find('#archiveMan').data('id'))||null
                }, {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        self.attachView.sendToServer(null, model.changed);
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            }
        },

        render: function () {
            var formString = this.template();
            var self = this;
            var model = new ProjectModel();
            var bonusView;
            var notDiv;
            var $thisEl;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : '900',
                title        : 'Create Project',
                buttons      : {
                    save: {
                        text : '新建',
                        class: 'btn blue',
                        click: function () {
                            self.saveItem();
                        }
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

            $thisEl = this.$el;

            this.attachView = new AttachView({
                model      : model,
                contentType: self.contentType,
                isCreate   : true
            });
            notDiv.append(this.attachView.render().el);

            this.renderAssignees(model);

            bonusView = new BonusView({
                model: model
            });

            populate.get('#projectTypeDD', CONSTANTS.URLS.PROJECT_TYPE, {}, 'name', this, true);
            populate.get('#paymentTerms', '/paymentTerm', {}, 'name', this, true, true, CONSTANTS.PAYMENT_TERMS);
            populate.get('#paymentMethod', '/paymentMethod', {}, 'name', this, true, true, CONSTANTS.PAYMENT_METHOD);
            populate.get2name('#customerDd', CONSTANTS.URLS.CUSTOMERS, {}, this, false, false);
            populate.getWorkflow('#workflowsDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {id: 'Projects'}, 'name', this, true);
            populate.get2name('#pmr', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false);
            populate.get2name('#pmv', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false);
            populate.get2name('#archiveMan', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false);
            populate.get('#lead', 'opportunities/getForDd', {}, 'name', this, false);

            $thisEl.find('#StartDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });
            $thisEl.find('#EndDateTarget').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });
            $thisEl.find('#signedDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });
            $thisEl.find('#archDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],

            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
