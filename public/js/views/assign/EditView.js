define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/assign/EditTemplate.html',
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
             CONSTANTS,
             dataService) {

    var EditView = ParentView.extend({
        contentType: 'Assign',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.ASSIGN;

            self.eventChannel = options.eventChannel;          

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('._modalSelect').find('.current-selected');

            endElem.text(target.text()).attr('data-id', target.attr('id'));

        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            var orderNumber = $.trim(this.$el.find('#orderNumber').val());
            var designDays = $.trim(this.$el.find('#designDays').val());
            var employeeId = this.$el.find('#employeesDd').attr('data-id');

            var data = {
                orderNumber   : orderNumber,
                designDays    : designDays,
                designer      : employeeId
                
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
                    Backbone.history.navigate('easyErp/assign', {trigger: true});
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

            if(this.currentModel.toJSON().attachments.length > 0){
                this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog',
                    width      : 800,
                    title      : 'edit assign',
                    buttons    : {
                        save: {
                            text : '分配',
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
            }
            else{
                return App.render({
                    type   : 'error',
                    message: '还未上传客户订单文件，不能分配！'
                });
            }

            this.$el.find('#arrivalDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });

            notDiv = this.$el.find('.attach-container');
            notDiv.append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: self.contentType
                }).render().el
            );

            var getDesigner = '/employees/getForDdByDeptId/' + CONSTANTS.DESIGN_DEPARTMENT_ID;

            populate.get2name('#employeesDd', getDesigner, {},  this, false, false);

            this.renderAssignees(this.currentModel);

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
