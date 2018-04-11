define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/building/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'dataService',
    'common',
    'populate',
    'custom',
    'constants'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             dataService,
             common,
             populate,
             custom,
             CONSTANTS) {

    var EditView = ParentView.extend({
        contentType: 'building',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.BUILDING;

            self.eventChannel = options.eventChannel;          

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            target.parents('dd').find('.current-selected').text(target.text()).attr('data-id', target.attr('id'));
        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            var name = $.trim(this.$el.find('#name').val());
            var projectManager = $.trim(this.$el.find('#projectManager').val());
            var customerId = this.$el.find('#customerId').attr('data-id');

            var data = {

                name   : name,
                projectManager   : projectManager,
                customerId       : customerId
                
            };

            event.preventDefault();

            this.currentModel.set(data);

            this.currentModel.save(this.currentModel.changed, {               
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    self.hideDialog();
                    Backbone.history.navigate('easyErp/building', {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },

        render: function (options) {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });
            var self = this;
            var notDiv;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 800,
                title      : 'edit building',
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
                    }
                }
            });

            dataService.getData('/building/getCustomers', {}, function (customers) {
                customers = _.map(customers.data, function (customer) {
                    customer.name = customer.name.first + ' ' + customer.name.last;

                    return customer;
                });

                self.responseObj['#customerId'] = customers;
            });

            dataService.getData('/employees/getForDd', {}, function (employees) {
                employees = _.map(employees.data, function (employee) {
                    employee.name = employee.name.first + ' ' + employee.name.last;

                    return employee;
                });

                self.responseObj['#projectManager'] = employees;
            });

            this.renderAssignees(this.currentModel);

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
