define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/settingsOverview/settingsEmployee/missionAllowance/EditTemplate.html',
    'models/missionAllowanceModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, EditTemplate, missionAllowanceModel, moment, CONSTANTS, populate, dataService) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'missionAllowance',
        template   : _.template(EditTemplate),
        responseObj: {},

        // events: {
        //     keydown: 'keyDownHandler'
        // },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/missionAllowance';

            self.eventChannel = options.eventChannel;

            self.render(options);
        },

        // keyDownHandler: function (e) {
        //     if (e.which === 13) {
        //         this.saveItem(e);
        //     }
        // },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            $('.newSelectList').hide();

            var id = $target.attr('id');

            dataService.getData('/missionAllowance/getDepAndJob', {id:id}, function(response, context){

                var departmentId = response[0].department._id;
                var departmentName = response[0].department.name;
                var jobPositionId = response[0].jobPosition._id;
                var jobPositionName = response[0].jobPosition.name;
                context.$el.find('#department').attr('data-id',departmentId);
                context.$el.find('#department').text(departmentName);
                context.$el.find('#jobPosition').attr('data-id',jobPositionId);
                context.$el.find('#jobPosition').text(jobPositionName);

            },this);
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;
            var name = $.trim($currentEl.find('#employeesDd').data('id'));
            var department = $.trim($currentEl.find('#department').data('id'));
            var jobPosition = $.trim($currentEl.find('#jobPosition').data('id'));
            var carLicense = $.trim($currentEl.find('#carLicense').val());
            var allowanceStandard = $.trim($currentEl.find('#allowanceStandard').val());

            var data = {
                name: name,
                Department: department,
                jobPosition: jobPosition,
                carLicense: carLicense,
                allowanceStandard: allowanceStandard
            };


            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (!name) {
                return App.render({
                    type   : 'error',
                    message: 'employee can\'t be empty'
                });
            }


            this.currentModel.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
                    self.eventChannel.trigger('updateMissionAllowance');
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
            var model = this.currentModel.toJSON();
            var formString = this.template({
                model: model
            });
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create missionAllowance',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-missionAllowance-dialog',
                        class: 'btn blue',
                        text : '保存',
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


            populate.get2name('#employeesDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {},  this, false, true);


            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
