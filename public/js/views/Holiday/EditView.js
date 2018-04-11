define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Holiday/EditTemplate.html',
    'views/dialogViewBase',
    'models/HolidayModel',
    'helpers/keyValidator',
    'populate',
    'constants',
    'dataService'
], function (Backbone, $, _, EditTemplate, ParentView, HolidayModel, keyValidator, populate, CONSTANTS, dataService) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'workCenters',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress .forNum': 'keypressHandler'
        },

        keypressHandler: function (e) {
            return keyValidator(e, true);
        },

        initialize: function (options) {
            this.currentModel = options.model;

            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            $('.newSelectList').hide();
        },

        saveItem: function () {
            var $el = this.$el;
            var self = this;
            var date = $el.find('#date').val();
            var type = $el.find('#type').data('id');
            var comment = $el.find('#comment').val();

            var data={
                date: date,
                type: type,
                comment: comment
            };

            this.currentModel.set(data);
            this.currentModel.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function (model, response) {
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
        },

        render: function () {
            var self = this;
            var formString = this.template({model: this.currentModel.toJSON()});

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 600,
                title      : 'Edit Work Center',
                buttons    : {
                    save: {
                        text : '确定',
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

            this.$el.find('#date').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            dataService.getData('Departments/getType', {}, function(response, context){
                    var types = [];
                    for(var i=0; i<response[0].type.length; i++){
                        var type = {
                            name: response[0].type[i],
                            _id: response[0].type[i]
                        };
                        types.push(type);
                    }
                    context.responseObj['#type'] = types;
                }, this);
            this.delegateEvents(self.events);

            return this;
        }

    });

    return EditView;
});
