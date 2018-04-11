define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/login/LoginTemplate.html',
    'custom'
], function (Backbone, _, $, LoginTemplate, Custom) {
    'use strict';

    var LoginView = Backbone.View.extend({
        el: '#wrapper',

        initialize: function (options) {
            if (options && options.dbs) {
                this.render(options);
            } else {
                this.render();
            }
        },

        events: {
            'submit #loginForm'     : 'login',
            'click .login-button'   : 'login',
            'submit #forgotPassword': 'forgotPassword',
            'click .submitButton'   : 'forgotPassword',
            'focus .ulogin'         : 'usernameFocus',
            'focus #upass'          : 'passwordFocus',
            'blur #ulogin'          : 'usernameFocus',
            'blur #upass'           : 'passwordFocus',
            'click #forgotPass'     : 'goForgotPass',
            'click #backToLogin'    : 'goForgotPass',
            'click #selectedDb'     : 'showHideDbs',
            'click #dbs li'         : 'selectDb',
            click                   : 'hideSelect'
        },

        hideSelect: function () {
            var $thisEl = this.$el;
            var $ul = $thisEl.find('#dbs');

            $ul.removeClass('openDd');
        },

        showHideDbs: function (e) {
            var $thisEl = this.$el;
            var $ul = $thisEl.find('#dbs');

            e.preventDefault();
            e.stopPropagation();

            $ul.toggleClass('openDd');
        },

        selectDb: function (e) {
            var $thisEl = this.$el;
            var $targetEl = $(e.target);
            var $li = $targetEl.closest('li');
            var $selectedDb = $thisEl.find('#selectedDb');
            var dbName = $li.attr('data-id');
            var fullText = $li.text();
            var $ul = $thisEl.find('#dbs');

            $ul.removeClass('openDd');

            $selectedDb.attr('data-id', dbName);
            $selectedDb.text(fullText);
        },

        goForgotPass: function (e) {
            var $currentEl = $(e.target);
            var id = $currentEl.attr('id');
            var $thisEl = this.$el;
            var $title = $thisEl.find('#titleForm');
            var $loginForm = $thisEl.find('#loginForm');
            var $forgotForm = $thisEl.find('#forgotPassword');

            var title = id === 'forgotPass' ? 'Forgot Your password?' : 'Login to your account';

            e.preventDefault();

            $title.text(title);

            $loginForm.toggleClass('hidden');
            $forgotForm.toggleClass('hidden');
            $title.toggleClass('green');
        },

        usernameFocus: function () {
            this.$el.find('.icon-login').toggleClass('active');
        },

        passwordFocus: function () {
            this.$el.find('.icon-pass').toggleClass('active');
        },

        login: function (event) {
            var $thisEl = this.$el;
            var currentDb = $thisEl.find('#selectedDb').attr('data-id');
            var $loginForm = $thisEl.find('#loginForm');
            var $errorContainer = $thisEl.find('.error');
            var login = $loginForm.find('.ulogin').val() || '';
            var pass = $thisEl.find('#upass').val() || '';
            var $checkedEl = $thisEl.find('#switchElement');
            var checked = $checkedEl.prop('checked');
            var err = '';
            var data;

            event.preventDefault();
            App.currentDb = currentDb;
            App.weTrack = true;

            $loginForm.removeClass('notRegister');

            data = {
                login     : login,
                pass      : pass,
                dbId      : currentDb,
                rememberMe: checked
            };

            if (!data.login || !data.pass) {
                $loginForm.addClass('notRegister');
            }

            if (data.login.length < 3) {
                err += 'Login must be longer than 3 characters' + '<br/>';
            }
            if (data.pass.length < 3) {
                err += 'Password must be longer than 3 characters';
            }
            if (err) {
                $errorContainer.html(err);
                $loginForm.addClass('notRegister');

                return;
            }

            $.ajax({
                url : '/users/login',
                type: 'POST',
                data: data,

                success: function () {
                    Custom.runApplication(true);

                    //FlurryAgent.logEvent('login', data);
                },

                error: function () {
                    $loginForm.addClass('notRegister');
                    App.render({
                        type   : 'error',
                        message: 'Wrong Password or such user doesn\'t registered'
                    });
                }
            });
        },

        forgotPassword: function (event) {
            var $thisEl = this.$el;
            var currentDb = $thisEl.find('#selectedDb').attr('data-id');
            var $backToLogin = $thisEl.find('#backToLogin');
            var $forgotForm = $thisEl.find('#forgotPassword');
            var $errorContainer = $thisEl.find('.error');
            var login = $forgotForm.find('.ulogin').val() || '';
            var err = '';
            var data;

            event.preventDefault();
            App.currentDb = currentDb;
            App.weTrack = true;

            data = {
                login: login,
                dbId : currentDb
            };

            if (data.login.length < 3) {
                err += 'Login must be longer than 3 characters' + '<br/>';
            }

            if (err) {
                $errorContainer.html(err);
                $forgotForm.addClass('notRegister');
                return;
            }

            $.ajax({
                url : '/users/forgotPassword',
                type: 'POST',
                data: data,

                success: function () {
                    $backToLogin.click();
                    setTimeout(function () {
                        App.render({
                            type   : 'notify',
                            message: 'The new password was sent to your email. Please check it'
                        });
                    }, 1000);
                },

                error: function () {
                    $forgotForm.addClass('notRegister');
                    $errorContainer.text('Please try again');
                }
            });
        },

        render: function (options) {
            var $thisEl = this.$el;
            var $backStratch;
            var self = this;

            $('title').text('Login');

            if (options) {
                $thisEl.html(_.template(LoginTemplate, options));
            } else {
                $thisEl.html(LoginTemplate);
                $thisEl.find('#loginForm').addClass('notRegister');
            }

            $backStratch = $thisEl.find('#backstretch');
            $backStratch.backstretch([
                //'images/imgs/front-img-1.jpg',
                'images/imgs/front-img-2.jpg',
                'images/imgs/front-img-3.jpg'
            ], {duration: 3000, fade: 750});

            $(document).on('keydown', function (e) {

                switch (e.which) {
                    case 13:
                        self.login(e);
                        break;
                    default:
                        break;
                }
            });

            return this;
        }
    });

    return LoginView;

});