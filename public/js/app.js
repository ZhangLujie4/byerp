// Filename: app.js
define([
    'jQuery',
    'router',
    'communication',
    'custom',
    'socket.io',
    'spinJs',
    'constants',
    'tracker',
    'moment',
], function ($, Router, Communication, Custom, io, Spinner, constants, tracker, moment) {
    var initialize = function () {
        'use strict';
        var appRouter = new Router();

        var opts = {
            lines    : 17, // The number of lines to draw
            length   : 30, // The length of each line
            width    : 5, // The line thickness
            radius   : 30, // The radius of the inner circle
            scale    : 0.75, // Scales overall size of the spinner
            corners  : 1, // Corner roundness (0..1)
            color    : '#fff', // #rgb or #rrggbb or array of colors
            opacity  : 0.25, // Opacity of the lines
            rotate   : 68, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            speed    : 1.6, // Rounds per second
            trail    : 89, // Afterglow percentage
            fps      : 20, // Frames per second when using setTimeout() as a fallback for CSS
            zIndex   : 2000000000, // The z-index (defaults to 2000000000)
            className: 'spinner', // The CSS class to assign to the spinner
            top      : '50%', // Top position relative to parent
            left     : '50%', // Left position relative to parent
            shadow   : true, // Whether to render a shadow
            hwaccel  : false, // Whether to use hardware acceleration
            position : 'absolute' // Element positioning
        };
        var target = document.getElementById('loading');
        var spinner = new Spinner(opts).spin(target);

        App.preloaderShowFlag = false;

        $(document).ajaxStart(function () {
            $(target).fadeIn();
        });
        $(document).ajaxComplete(function () {
            if (!App.preloaderShowFlag) {
                $(target).fadeOut();
            }
        });

        appRouter.checkLogin = Communication.checkLogin;
        Communication.checkLogin(Custom.runApplication);

        App.startPreload = function () {
            App.preloaderShowFlag = true;
            $('#loading').show();
        };

        App.stopPreload = function () {
            App.preloaderShowFlag = false;
            $('#loading').hide();
        };
    };

    var applyDefaults = function () {
        moment.updateLocale('en', {
                months: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
                weekdaysShort: ['日','一','二','三','四','五','六']
            })
      $.datepicker.setDefaults({
            dateFormat:'yy-mm-dd',
            regional: ['zh-CN']
            // firstDay: 1,
           // minDate : new Date(constants.MIN_DATE) //toDo disable for startDate of program
        });
        // add ability to clear console by calling -> console.API.clear();
        if (typeof console._commandLineAPI !== 'undefined') {
            console.API = console._commandLineAPI;
        } else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
            console.API = console._inspectorCommandLineAPI;
        } else if (typeof console.clear !== 'undefined') {
            console.API = console;
        }
        // add startsWith function to strings
        if (typeof String.prototype.startsWith !== 'function') {
            String.prototype.startsWith = function (str) {
                if (str === 'All') {
                    return true;
                }
                if (str === '0-9') {
                    return !isNaN(parseInt(this[0], 10));
                }
                return this.indexOf(str) === 0;
            };
        }
        $.extend($.ui.dialog.prototype.options, {
            modal    : true,
            resizable: false,
            draggable: true,
            autoOpen : true,
            width    : 700,
            appendTo : '#dialogContainer',
            create   : function (event, ui) {
                var win = $(window);
                var dialog = $(event.target).parent('.ui-dialog');
                // var top = $(document).scrollTop() + (win.height() - dialog.height() - 200) / 2; //8.7.16(Pogorilyak)
                var top = (win.height() - dialog.height() ) / 2;
                var left = (win.width() - dialog.width()) / 2;

                dialog.css({
                    position: 'absolute',
                    top     : top,
                    left    : left
                });
            }
        });
        $.datepicker.setDefaults({
            dateFormat: 'yy-mm-dd',

            onChangeMonthYear: function (year, month) {
                var mon;
                var target;
                var day;

                switch (month) {
                    case 1:
                        mon = '01';
                        break;
                    case 2:
                        mon = '02';
                        break;
                    case 3:
                        mon = '03';
                        break;
                    case 4:
                        mon = '04';
                        break;
                    case 5:
                        mon = '05';
                        break;
                    case 6:
                        mon = '06';
                        break;
                    case 7:
                        mon = '07';
                        break;
                    case 8:
                        mon = '08';
                        break;
                    case 9:
                        mon = '09';
                        break;
                    case 10:
                        mon = '10';
                        break;
                    case 11:
                        mon = '11';
                        break;
                    case 12:
                        mon = '12';
                        break;
                    // skip default;
                }

                target = $(this);
                day = target.val().split('-')[2] || '01';
                target.val(year + '-' + mon + '-' + day);
            }
        });

        $(window).on('beforeunload', function (e) {
            var currentUser = App.currentUser || {};

            tracker.track({
                date   : new Date(),
                name   : 'sessionEnd',
                message: 'sessionEnd',
                email  : currentUser.email,
                login  : currentUser.login
            });
            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'close',
                message  : 'close',
                email    : currentUser.email,
                login    : currentUser.login
            });

            App.Tracker.send.call(App.Tracker);
        });
    };

    return {
        initialize   : initialize,
        applyDefaults: applyDefaults
    };
});
