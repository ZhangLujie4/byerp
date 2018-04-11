define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Users/CreateTemplate.html',
    'models/UsersModel',
    'common',
    'populate',
    'Validation'
], function (Backbone, $, _, CreateTemplate, UsersModel, common, populate, Validation) {

    var UsersCreateView = Backbone.View.extend({
        el         : '#content-holder',
        contentType: 'Users',
        template   : _.template(CreateTemplate),
        imageSrc   : '',
        initialize : function () {
            _.bindAll(this, 'saveItem');
            this.model = new UsersModel();
            this.responseObj = {};
            this.render();
        },

        events: {
            'submit form'                                                     : 'submit',
            'mouseenter .avatar'                                              : 'showEdit',
            'mouseleave .avatar'                                              : 'hideEdit',
            'click .current-selected'                                         : 'showNewSelect',
            'click .newSelectList li:not(.miniStylePagination)'               : 'chooseOption',
            'click .newSelectList li.miniStylePagination'                     : 'notHide',
            'click .newSelectList li.miniStylePagination .next:not(.disabled)': 'nextSelect',
            'click .newSelectList li.miniStylePagination .prev:not(.disabled)': 'prevSelect',
            click                                                             : 'hideNewSelect',
            'keypress #login'                                                 : 'checkLoginInputKey'
        },

        notHide: function () {
            return false;
        },

        showNewSelect: function (e, prev, next) {
            populate.showSelect(e, prev, next, this);
            return false;
        },

        chooseOption: function (e) {
            $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
            $('.newSelectList').hide();
        },

        nextSelect: function (e) {
            this.showNewSelect(e, false, true);
        },

        prevSelect: function (e) {
            this.showNewSelect(e, true, false);
        },

        hideNewSelect: function () {
            $('.newSelectList').hide();
        },

        checkLoginInputKey: function (e) {
            var char = String.fromCharCode(e.charCode);

            if (Validation.loginCharNotValid(char)) {
                e.preventDefault();
            }
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        showEdit: function () {
            $('.upload').animate({
                height : '20px',
                display: 'block'
            }, 250);

        },

        hideEdit: function () {
            $('.upload').animate({
                height : '0px',
                display: 'block'
            }, 250);

        },

        saveItem: function () {
            var self = this;
            var mid = 39;
            this.model.save({
                imageSrc: this.imageSrc,
                email   : $.trim(this.$el.find('#email').val()),
                login   : $.trim(this.$el.find('#login').val()),
                pass    : $.trim(this.$el.find('#password').val()),
                profile : $.trim(this.$el.find('#profilesDd').data('id'))
            }, {
                headers: {
                    mid: mid
                },

                wait: true,

                success: function () {
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                },

                confirmPass: $('#confirmpassword').val()
            });

        },

        render: function () {
            var formString = this.template();
            var self = this;
            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                dialogClass  : 'edit-dialog',
                width        : '600',
                resizable    : true,
                title        : '创建用户',
                buttons      : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        click: self.saveItem
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
            populate.get('#profilesDd', 'profiles/forDd', {}, 'profileName', this, true);
            common.canvasDraw({model: this.model.toJSON()}, this);
            return this;
        }
    });

    return UsersCreateView;
});
