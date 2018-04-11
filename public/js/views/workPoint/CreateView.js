define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/workPoint/CreateTemplate.html',
    'views/dialogViewBase',
    'models/workPointModel',
    'helpers/keyValidator',
    'populate',
    'constants'
], function (Backbone, $, _, CreateTemplate, ParentView, workPointModel, keyValidator, populate, CONSTANTS) {

    var CreateView = ParentView.extend({
        el                  : '#content-holder',
        template            : _.template(CreateTemplate),
        imageSrc            : '',
        searchProdCollection: null,
        responseObj: {},

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.render();
        },

        events: {
            'keypress .forNum': 'keypressHandler'
        },

        keypressHandler: function (e) {
            return keyValidator(e, true);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            $('.newSelectList').hide();
        },

        saveItem: function (e) {
            var $el = this.$el;
            var self = this;
            var employee = $el.find('#employeesDd').attr('data-id');
            var point = $el.find('#point').val();

            data={
                employee: employee,
                point: point
            };
            console.log(data);
            var model = new workPointModel();
            model.save(data, {
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
            var formString = self.template({});

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 600,
                title      : 'Create Product',
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

            populate.get2name('#employeesDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {},  this, true, true);
            this.delegateEvents(self.events);

            return this;
        }

    });

    return CreateView;
});
