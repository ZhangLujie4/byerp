﻿define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/enterprise/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService',
    'moment'
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
             dataService,
             moment) {

    var EditView = ParentView.extend({
        contentType: 'Accept',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {

        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.ENTERPRISE;
            this.responseObj = {};
            var self=this;

            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;


            var fullName = $.trim(this.$el.find('#fullName').val());
            var shortName = $.trim(this.$el.find('#shortName').val());
            var taxFileNumber = $.trim(this.$el.find('#taxFileNumber').val());
            var spell = $.trim(this.$el.find('#spell').val());
            var region = $.trim(this.$el.find('#region').val());
            var linkman = $.trim(this.$el.find('#linkman').val());
            var phone = $.trim(this.$el.find('#phone').val());
            var bank = $.trim(this.$el.find('#bank').val());
            var account = $.trim(this.$el.find('#account').val());

            data = {
                fullName:fullName,
                shortName:shortName,
                taxFileNumber:taxFileNumber,
                spell:spell,
                region:region,
                linkman:linkman,
                phone:phone,
                bank:bank,
                account:account
            };

            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {
                    self.hideDialog();
                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});

                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        deleteItem: function (event) {
            var mid;
            var self = this;
            var answer;

            event.preventDefault();

            mid=39;

            answer = confirm('Really DELETE items ?!');

            if (answer === true) {
                this.currentModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function (model) {

                        model = model.toJSON();

                        $("tr[data-id='" + model._id + "'] td").remove();
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                        self.hideDialog();
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            }
        },

        render: function () {
            var model=this.currentModel.toJSON();

            var formString = this.template({
                model:model
            });

            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog  task-edit-dialog',
                width: 700,
                buttons: {
                    save: {
                        text: '保存',
                        class: 'btn blue',
                        click: self.saveItem
                    },
                    cancel: {
                        text: '取消',
                        class: 'btn',
                        click: self.hideDialog
                    },
                    delete: {
                        text: '删除',
                        class: 'btn',
                        click: self.deleteItem
                    }
                }
            });

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
