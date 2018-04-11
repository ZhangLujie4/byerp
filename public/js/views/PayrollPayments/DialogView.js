define([
    'Backbone',
    'jQuery',
    'underscore',
    'text!templates/PayrollPayments/DialogTemplate.html',
    'helpers'
], function (Backbone, $, _, CreateTemplate, helpers) {
    'use strict';

    var CreateView = Backbone.View.extend({
        el           : '#content-holder',
        template     : _.template(CreateTemplate),
        changedModels: {},

        initialize: function (options) {
            this.render(options);

            this.$bodyContainer = this.$el.find('#payRoll-listTable');
        },

        events: {},

        removeDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var formString = this.template({model: options, currencySplitter: helpers.currencySplitter});
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : '创建付款',
                width        : '900px',
                buttons      : [
                    {
                        text : 'OK',
                        click: function () {
                            self.removeDialog();
                        }
                    }]

            });

            this.$el.find('#deleteBtn').hide();

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
