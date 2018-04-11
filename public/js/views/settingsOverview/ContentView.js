define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/settingsOverview/settingsEmployee/TabsTemplate.html',
    'collections/weeklyScheduler/filterCollection',
    'collections/scheduledPay/filterCollection',
    'collections/departmentExternal/filterCollection',
    'collections/personExternal/filterCollection',
    'collections/tax/filterCollection',
    'collections/taxFree/filterCollection',
    'collections/personDeduction/filterCollection',
    'collections/minimumWage/filterCollection',
    'collections/missionAllowance/filterCollection',
    'views/settingsOverview/settingsEmployee/weeklyScheduler/ListView',
    'views/settingsOverview/settingsEmployee/scheduledPay/ListView',
    'views/settingsOverview/settingsEmployee/employeeProfileSettings/Index',
    'views/settingsOverview/settingsEmployee/payrollComponentTypes/ListView',
    'views/settingsOverview/settingsEmployee/payrollStructureTypes/ListView',
    'views/settingsOverview/settingsEmployee/departmentExternal/list/ListView',
    'views/settingsOverview/settingsEmployee/personExternal/list/ListView',
    'views/settingsOverview/settingsEmployee/tax/list/ListView',
    'views/settingsOverview/settingsEmployee/taxFree/list/ListView',
    'views/settingsOverview/settingsEmployee/personDeduction/list/ListView',
    'views/settingsOverview/settingsEmployee/minimumWage/list/ListView',
    'views/settingsOverview/settingsEmployee/missionAllowance/list/ListView',
    'views/settingsOverview/settingsEmployee/employeeProfileSettings/Index'
], function ($,
             _,
             Backbone,
             Parent,
             TabsTemplate,
             WeeklySchedulerCollection,
             ScheduledPayCollection,
             DepartmentExternalCollection,
             PersonExternalCollection,
             TaxCollection,
             TaxFreeCollection,
             PersonDeductionCollection,
             MinimumWageCollection,
             MissionAllowanceCollection,
             WeeklySchedulerView,
             ScheduledPayView,
             DefaultProfileViewView,
             PayrollComponentTypeView,
             PayrollStructureView,
             DepartmentExternalView,
             PersonExternalView,
             TaxView,
             TaxFreeView,
             PersonDeductionView,
             MinimumWageView,
             MissionAllowanceView,
             EmployeeProfileSettings
             ) {

    var SettingsEmployeeListView = Parent.extend({
        el      : '#content-holder',
        template: _.template(TabsTemplate),

        initialize: function (options) {
            this.startTime = options.startTime;
            this.weeklySchedulerCollection = new WeeklySchedulerCollection({});
            this.scheduledPayCollection = new ScheduledPayCollection({});

            this.weeklySchedulerCollection.bind('reset', this.renderWeeklyScheduler, this);
            this.scheduledPayCollection.bind('reset', this.renderScheduledPay, this);

            var eventChannel = {};
            var self = this;
            _.extend(eventChannel, Backbone.Events);
            self.eventChannel = eventChannel;

            this.render();

            self.eventChannel.on('updateDepartmentExternal', self.getDepartmentExternal, self);
            self.eventChannel.on('updatePersonExternal', self.getPersonExternal, self);
            self.eventChannel.on('updateTax', self.getTax, self);
            self.eventChannel.on('updateTaxFree', self.getTaxFree, self);
            self.eventChannel.on('updatePersonDeduction', self.getPersonDeduction, self);
            self.eventChannel.on('updateMinimumWage', self.getMinimumWage, self);
            self.eventChannel.on('updateMissionAllowance', self.getMissionAllowance, self);

            this.renderDefaultProfile();
            this.getPayrollEarningsType();
            this.getPayrollDeductionsType();
            this.getPayrollStructure();
            this.getDepartmentExternal();
            this.getPersonExternal();
            this.getTax();
            this.getTaxFree();
            this.getPersonDeduction();
            this.getMinimumWage();
            this.getMissionAllowance();

            $('#top-bar').html('');
        },

        getPayrollEarningsType: function () {
            var self = this;

            if (self.payrollEarningsType) {
                self.payrollEarningsType.undelegateEvents();
            }

            self.payrollEarningsType = new PayrollComponentTypeView({
                type: 'earnings',
                el  : '#payrollEarningsTab'
            });
        },

        getPayrollStructure: function () {
            var self = this;

            if (self.payrollStructure) {
                self.payrollStructure.undelegateEvents();
            }

            self.payrollStructure = new PayrollStructureView({
                el: '#payrollStructureTab'
            });
        },

        getPayrollDeductionsType: function () {
            var self = this;

            if (self.payrollDeductionsType) {
                self.payrollDeductionsType.undelegateEvents();
            }

            self.payrollDeductionsType = new PayrollComponentTypeView({
                type: 'deductions',
                el  : '#payrollDeductionsTab'
            });
        },

        getDepartmentExternal: function () {
            var self = this;

            if (self.departmentExternal) {
                self.departmentExternal.undelegateEvents();
            }
            console.log(self.eventChannel);
            self.departmentExternal = new DepartmentExternalView({
                eventChannel: self.eventChannel,
                type: 'departmentExternal',
                el: '#departmentExternalTab'
            });
        },

        getPersonExternal: function () {
            var self = this;

            if(self.personExternal) {
                self.personExternal.undelegateEvents();
            }

            self.personExternal = new PersonExternalView({
                eventChannel: self.eventChannel,
                type: 'personExternal',
                el: '#personExternalTab'
            });
        },

        getTax: function() {
            var self = this;

            if(self.tax) {
                self.tax.undelegateEvents();
            }

            self.tax = new TaxView({
                eventChannel: self.eventChannel,
                type: 'tax',
                el: '#taxTab'
            })
        },

        getTaxFree: function() {
            var self = this;

            if(self.taxFree) {
                self.taxFree.undelegateEvents();
            }

            self.taxFree = new TaxFreeView({
                eventChannel: self.eventChannel,
                type: 'taxFree',
                el: '#taxFreeTab'
            })
        },

        getPersonDeduction() {
            var self = this;

            if(self.personDeduction) {
                self.personDeduction.undelegateEvents();
            }

            self.personDeduction = new PersonDeductionView({
                eventChannel: self.eventChannel,
                type: 'personDeduction',
                el: '#personDeductionTab'
            })
        },

        getMinimumWage() {
            var self = this;

            if(self.minimumWage) {
                self.minimumWage.undelegateEvents();
            }

            self.minimumWage = new MinimumWageView({
                eventChannel: self.eventChannel,
                type: 'minimumWage',
                el: '#minimumWageTab'
            })
        },

        getMissionAllowance() {
            var self = this;

            if(self.missionAllowance) {
                self.missionAllowance.undelegateEvents();
            }

            self.missionAllowance = new MissionAllowanceView({
                eventChannel: self.eventChannel,
                type: 'missionAllowance',
                el: '#missionAllowanceTab'
            })
        },

        renderWeeklyScheduler: function () {
            new WeeklySchedulerView({
                collection: this.weeklySchedulerCollection
            }).render();
        },

        renderDefaultProfile: function () {
            new DefaultProfileViewView({});
        },

        renderScheduledPay: function () {
            new ScheduledPayView({
                collection: this.scheduledPayCollection
            }).render();
        },

        render: function () {
            var formString = this.template();

            this.$el.html(formString);

            return this;
        }

    });

    return SettingsEmployeeListView;
});
