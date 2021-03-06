define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/managementRule/CreateTemplate.html',
    'models/managementRuleModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, CreateTemplate, managementRuleModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'managementRule',
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

            var categoryTex = $.trim($currentEl.find('#categoryTex').val());
            var categoryNum = $.trim($currentEl.find('#categoryNum').val());
            var number = $.trim($currentEl.find('#number').val());
            var content = $.trim($currentEl.find('#content').val());
            var penalty = $.trim($currentEl.find('#penalty').val());

            var data = {
                categoryTex: categoryTex,
                categoryNum: categoryNum,
                number     : number,
                content    : content,
                penalty    : penalty
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }


            model = new managementRuleModel();
            model.urlRoot = function () {
                return 'managementRule';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
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
                title        : 'Create managementRule',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-managementRule-dialog',
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
