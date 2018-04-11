define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/settingsOverview/settingsEmployee/personDeduction/CreateTemplate.html',
    'models/personDeductionModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, CreateTemplate, personDeductionModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'personDeduction',
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
            var year = $.trim($currentEl.find('#year').val());
            var month = $.trim($currentEl.find('#month').val());
            var employee = $.trim($currentEl.find('#employeesDd').data('id'));
            var deductionName = $.trim($currentEl.find('#deductionName').val());
            var amount = $.trim($currentEl.find('#amount').val()*100);
            var comment = $.trim($currentEl.find('#comment').val()*100);

            var data = {
                year: year,
                month: month,
                employee: employee,
                deductionName: deductionName,
                amount: amount,
                comment: comment
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (!employee) {
                return App.render({
                    type   : 'error',
                    message: 'employee can\'t be empty'
                });
            }

            model = new personDeductionModel();
            model.urlRoot = function () {
                return 'personDeduction';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
                    self.eventChannel.trigger('updatePersonDeduction');
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
                title        : 'Create personDeduction',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-personDeduction-dialog',
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

            populate.get2name('#employeesDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {},  this, true, true);


            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
