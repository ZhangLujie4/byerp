define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/aluveneerOrders/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
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
             common,
             populate,
             custom,
             CONSTANTS) {

    var EditView = ParentView.extend({
        contentType: 'AluveneerOrders',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.ALUVENEERORDERS;

            self.eventChannel = options.eventChannel;

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('dd').find('.current-selected');

            endElem.text(target.text()).attr('data-id', target.attr('id'));
            endElem.attr('data-shortdesc', target.data('level'));

        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;            

            var routing = $.trim(this.$el.find('#routing').val());
            var boardType = $.trim(this.$el.find('#boardType').val());
            
            var data = {
                routing  : routing,
                boardType: boardType
            };

            event.preventDefault();

            //this.currentModel.set(data);

            this.currentModel.save(data, {               
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    //self.hideDialog();
                    //Backbone.history.navigate('easyErp/aluveneerOrders', {trigger: true});
                    url = window.location.hash;

                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
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

            if(this.currentModel.toJSON().priApproval == false){
                this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog',
                    width      : 800,
                    title      : 'edit aluveneerOrder',
                    buttons    : {
                        save: {
                            text : '修改',
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
                    message: '该条记录已审核！'
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

            populate.get2name('#employeesDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {},  this, true, true);

            this.renderAssignees(this.currentModel);

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
