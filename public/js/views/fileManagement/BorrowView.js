define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/fileManagement/borrowTemplate.html',
    'models/fileManagementModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, borrowTemplate, fileManagementModel, common, populate, ParentView, CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var BorrowView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'fileManagement',
        template   : _.template(borrowTemplate),
        imageSrc   : '',
        responseObj: {},
        events: {
            'click #avatar'                        : 'showBigPic'
         },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = options.model || options.collection.getElement();
            this.model = new fileManagementModel();
            this.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function () {
            var self = this;
            var mid = 39;
            var $currentEl = this.$el;
            var certificate = $currentEl.find('#certificateNumber').data('id');
            var reason = $.trim($currentEl.find('#reason').val());
            var borrowDate = $.trim($currentEl.find('#borrowDate').val());
            var expectedDate = $.trim($currentEl.find('#expectedDate').val());
            var borrowDepartment = $currentEl.find('#borrowDepartment').data('id');
            var name = $.trim($currentEl.find('#name').val());
            var ID = $.trim($currentEl.find('#ID').val());
            var phone = $.trim($currentEl.find('#phone').val());

            var data = {
                certificate : certificate,
                reason      : reason,
                borrowDate  : borrowDate,
                expectedDate: expectedDate,
                borrowDepartment : borrowDepartment,
                borrower           : {
                    name    : name,
                    ID      : ID,
                    phone   : phone
                }
            };


            this.model.save(data,
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        Backbone.history.navigate('easyErp/fileManagement', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        hideSaveCancelBtns: function () {
            var cancelBtnEl = $('#top-bar-saveBtn');
            var saveBtnE1 = $('#top-bar-deleteBtn');
            var createBtnE1 = $('#top-bar-createBtn');
            this.changed = false;

            cancelBtnEl.hide();
            saveBtnE1.hide();
            createBtnE1.show();
            return false;
        },

        showBigPic: function(e){
            this.$el.find('.big-pic img').attr('src', this.imageSrc);
            this.$el.find('.big-pic img').css('max-width','100%');
            e.preventDefault();
            e.stopPropagation();
             $(".big-pic").dialog({
                dialogClass  : "show-images-dialog",
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                title        : "Show Images",
                width        : "900px",
                buttons      : {
                    cancel: {
                        text : "取消",
                        class: "btn blue",
                        click: function () {
                            $(this).dialog("close");
                            $("#dialogContainer .ui-dialog.show-images-dialog").remove();
                        }
                    }
                }
             });

        },

        canvasDrawing: function () {
            var canvas = this.$('#avatar')[0];
            var model = this.currentModel.toJSON() || {
                model: {
                    imageSrc: "data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAABAAAAAQADq8/hgAAAEaElEQVRYw82X6XLbNhCA+f4PVomk5MRyHDtp63oEgDcl3vfRBQhQIEVKSvsnO+OxRBEfFnthV+n/pyi/NaCryzzL8rJu/wOgzQPXJBgjhDExnXPW/Aqgy30DI0yIwYQQ4Bhe2j0I6BIbI1jL9meC2TdkRu0jgMxCGN5H2HT8IIzjKPAdE9NngEjuAhqfv3rOpe3aIrDAFoB1qtuA3ADlMXKuz9vlLqZokt4CxPAOQXa2bPDCRVSJYB0QIDA4ibp+TVKDbuCvAeh6YpX9DWkcUGJCkAARXW9UfXeL0PmUcF4CZBA4cALv5nqQM+yD4mtATQMOGMi9RzghiKriCuBiAzsB1e8uwUUGtroZIAEsqfqHCI2JjdGZHNDSZzHYb0boQK4JOTVXNQFEoJXDPskEvrYTrJHgIwOdZEBrggXzfkbo+sY7Hp0Fx9bUYbUEAAtgV/waHAcCnOew3arbLy5lVXGSXIrKGQkrKKMLcnHsPjEGAla1PYi+/YCV37e7DRp1qUDjwREK1wjbo56hezRoPLxt9lzUg+m96Hvtz3BMcU9syQAxKBSJ/c2Nqv0Em5C/97q+BdGoEuoORN98CkAqzsAAPh690vdv2tOOEcx/dodP0zq+qjpoQQF7/Vno2UA0OgLQQbUZI6t/1+BlRgAlyywvqtNXja0HFQ7jGVwoUA0HUBNcMvRdpW8PpzDPYRAERfmNE/TDuE8Ajis4oJAiUwB2+g+am3YEEmT5kz4HgOdRygHUIPEMsFf/YvXJYoSKbPczQI4HwysSbKKBdk4dLAhJsptrUHK1lSERUDYD6E9pGLsjoXzRZgAIJVaYBCCfA57zMBoJYfV9CXDigHhRgww2Hgngh4UjnCUbJAs2CEdCkl25kbou5ABh0KkXPupA6IB8fOUF4TpFOs5Eg50eFSOBfOz0GYCWoJwDoJzwcjQBfM2rMAjD0CEsL/Qp4ISG/FHkuJ4A9toXv66KomosMMNAuAA6GxOWPwqP64sb3kTm7HX1Fbsued9BXjACZKNIphLz/FF4WIps6vqff+jaIFAONiBbTf1hDITti5RLg+cYoDOxqJFwxb0dXmT5Bn/Pn8wOh9dQnMASK4aaSGuk+G24DObCbm5XzkXs9RdASTuytUZO6Czdm2BCA2cSgNbIWedxk0AV4FVYEYFJpLK4SuA3DrsceQEQl6svXy33CKfxIrwAanqZBA8R4AAQWeUMwJ6CZ7t7BIh6utfos0uLwxqP7BECMaTUuQCoawhO+9sSUWtjs1kA9I1Fm8DoNiCl64nUCsp9Ym1SgncjoLoz7YTl9dNOtbGRYSAjWbMDNPKw3py0otNeufVYN2wvzha5g6iGzlTDebsfEdbtW9EsLOvYZs06Dmbsq4GjcoeBgThBWtRN2zZ1mYUuGZ7axfz9hZEns+mMQ+ckzIYm/gn+WQvWWRq6uoxuSNi4RWWAYGfRuCtjXx25Bh25MGaTFzaccCVX1wfPtkiCk+e6nh/ExXps/N6z80PyL8wPTYgPwzDiAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDExLTAxLTE5VDAzOjU5OjAwKzAxOjAwaFry6QAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMC0xMi0yMVQxNDozMDo0NCswMTowMGxOe/8AAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC"
                }
            };
            var img = new Image();

            img.onload = function () {
                var ctx = canvas.getContext("2d");

                ctx.drawImage(img, 0, 0, 140, 140);
            };

            img.src = model.imageSrc;
            this.imageSrc = model.imageSrc;
        },

        render: function (options) {
            
            var formString = this.template({
                model: this.currentModel.toJSON(),
                moment: moment
            });
            var self = this;
            //var $thisEl = this.$el;


            this.$el = $(formString).dialog({
                closeOnEscape: false,
                draggable    : true,
                autoOpen     : true,
                resizable    : true,
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create Certificate',
                buttons    : {
                    save: {
                        text : '借出',
                        class: 'btn blue',
                        id   : 'createBtnDialog',
                        click: self.saveItem

                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                            // self.hideSaveCancelBtns();
                        }
                    }
                }
            });



            populate.get('#borrowDepartment', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, true, true);
            
            this.$el.find('#expectedDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            this.$el.find('#borrowDate').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return BorrowView;

});
