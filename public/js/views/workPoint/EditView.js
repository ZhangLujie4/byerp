define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/workPoint/EditTemplate.html',
    'views/dialogViewBase',
    'helpers/keyValidator',
    'populate',
    'constants'
], function (Backbone, $, _, EditTemplate, ParentView, keyValidator, populate, CONSTANTS) {

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
            var employee = $el.find('#employeesDd').data('id');
            var point = $el.find('#point').val();

            var data = {
                employee: employee,
                point: point
            };

            this.currentModel.set(data);

            this.currentModel.save(this.currentModel.changed, {
                patch  : true,
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

            populate.get2name('#employeesDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {},  this, false, true);
            this.delegateEvents(self.events);

            return this;
        }

    });

    return EditView;
});
