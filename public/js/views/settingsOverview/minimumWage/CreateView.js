define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/settingsOverview/settingsEmployee/minimumWage/CreateTemplate.html',
    'models/minimumWageModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, CreateTemplate, minimumWageModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'taxFree',
        template   : _.template(CreateTemplate),
        responseObj: {},

        // events: {
        //     keydown: 'keyDownHandler'
        // },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;

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
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;
            var communication = $.trim($currentEl.find('#communication').val());
            var wage = $.trim($currentEl.find('#wage').val()*100);

            var data = {
                communication : communication,
                wage   : wage,
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }


            model = new minimumWageModel();
            model.urlRoot = function () {
                return 'minimumWage';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
                    self.eventChannel.trigger('updateMinimumWage');
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
                title        : 'Create minimumWage',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-minimumWage-dialog',
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


            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
