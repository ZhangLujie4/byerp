define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/engineerInfo/checkSituation/FileView',
    'text!templates/checkSituApprove/EditTemplate.html',
    'models/checkSituationModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, FileView, EditTemplate, checkSituationModel, moment, CONSTANTS, populate, dataService) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'checkSituApprove',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'click .checkSituEditList td': 'goToEditDialog'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/checkSituApprove';

            self.eventChannel = options.eventChannel;

            self.responseObj['#approve'] = [
                {
                    _id : true,
                    name: '同意'
                },
                {
                    _id : false,
                    name: '不同意'
                }
            ];
            self.render(options);
        },

        goToEditDialog: function (e) {
            var num = $(e.target).closest('tr').attr('data-index');

            var model = this.currentModel[num];
            return new FileView({
                model: model
            });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            $('.newSelectList').hide();
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;
            var approve = $currentEl.find('#approve').data('id');
            var timeStamp = $currentEl.find('#timeStamp').data('id');
            var status = $currentEl.find('#status').data('id');
            var data = {
                approve: approve,
                timeStamp: timeStamp,
                status: status
            };
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            dataService.patchData('/checkSituApprove', data, function(result){
                self.hideDialog();
                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
            // this.currentModel.save(data, {
            //     patch  : true,
            //     headers: {
            //         mid: 103
            //     },
            //     wait   : true,
            //     success: function () {
            //         self.hideDialog();
            //         Backbone.history.fragment = '';
            //         Backbone.history.navigate(window.location.hash, {trigger: true});
            //     },

            //     error: function (model, xhr) {
            //         self.errorNotification(xhr);
            //     }
            // });
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var model = this.currentModel;

            var formString = this.template({
                model: model,
                moment: moment
            });
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Edit engineerManager',
                width        : '90%',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        text : '确定',
                        class: 'btn blue',
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

            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
