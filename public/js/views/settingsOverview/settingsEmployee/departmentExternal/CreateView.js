define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/settingsOverview/settingsEmployee/departmentExternal/CreateTemplate.html',
    'models/departmentExternalModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, CreateTemplate, departmentExternalModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'departmentExternal',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;

            self.eventChannel = options.eventChannel;

            self.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            console.log($target.parents('dd').find('.current-selected').text());
            $('.newSelectList').hide();
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;
            var date = $.trim($currentEl.find('#date').val());
            var year = moment(date).year();
            var month = moment(date).month()+1;
            var department = $.trim($currentEl.find('#departmentsDd').data('id'));
            var allowanceName = $.trim($currentEl.find('#allowanceName').val());
            var amount = $.trim($currentEl.find('#amount').val());

            var data = {
                year: year,
                month: month,
                department: department,
                allowanceName: allowanceName,
                amount: amount
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (!department) {
                return App.render({
                    type   : 'error',
                    message: 'department can\'t be empty'
                });
            }

            model = new departmentExternalModel();
            model.urlRoot = function () {
                return 'departmentExternal';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function (model) {
                    self.hideDialog();
                    self.eventChannel.trigger('updateDepartmentExternal');

                    self.collection.add(model, {remove: false});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create departmentExternal',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-departmentExternal-dialog',
                        class: 'btn blue',
                        text : '创建',
                        click: function () {
                            self.saveItem();
                        }
                    },

                    {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });

            populate.get('#departmentsDd', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, true, true);

            this.$el.find('#date').datepicker({
                dateFormat : 'yy-mm',
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
