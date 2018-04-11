define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dailyReport/form/FormView',
    'text!templates/dailyReport/form/EditTemplate.html',
    'common',
    'custom',
    'dataService',
    'populate',
    'constants',
    'helpers',
], function (Backbone, $, _, ParentView, EditTemplate, common, Custom, dataService, populate, CONSTANTS, helpers) {

    var EditView = ParentView.extend({
        contentType: 'dailyReport',
        imageSrc   : '',
        template   : _.template(EditTemplate),
        el         : '.form-holder',

        initialize: function (options) {
            var modelObj;

             if (options) {
                 this.visible = options.visible;
             }

            _.bindAll(this, 'render', 'saveItem');
            _.bindAll(this, 'render', 'deleteItem');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = '/dailyReport';
            this.responseObj = {};
            this.editable = options.editable || true;
            //this.balanceVissible = false;
            modelObj = this.currentModel.toJSON();
            this.onlyView = (modelObj.status == 'new') ? false : true;
            this.deletedProducts = [];

            App.stopPreload();
        },





        saveDailyReport: function (e) {
            e.preventDefault();

            this.saveItem();
        },

        saveItem: function () {
            console.log('到saveItem');
            var $el = this.$el;
            var self = this;
            var dateStr = $el.find('#dateStr').val();
            var content = $el.find('#content').val()? $el.find('#content').val().replace(/\n|\r\n/g,"<br>") : '';
            var review = $el.find('#review').val()? $el.find('#review').val().replace(/\n|\r\n/g,"<br>") : '';

            var data = {
                dateStr: dateStr,
                content: content,
                review: review
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

        render: function () {
            var self = this;
            var $thisEl = this.$el;
            var formString;
            var buttons;
            var template;

            if (!this.onlyView) {
                buttons = [{
                    text : '保存',
                    class: 'btn blue',
                    click: function () {
                        self.saveItem();
                    }
                }, {
                    text : '取消',
                    class: 'btn',
                    click: function () {
                        self.hideDialog();
                    }
                }
                ];
            } else {
                buttons = [{
                    text : '关闭',
                    class: 'btn',
                    click: function () {
                        self.hideDialog();
                    }
                }
                ];
            }

            this.template = _.template(EditTemplate);

            var currentModelJSON = this.currentModel.toJSON();

            formString = this.template({
                model   : currentModelJSON,
                visible : this.visible,
                onlyView: this.onlyView,
                //forSales: this.forSales,
                dialog  : this.dialog
            });

            if (!this.dialog) {
                $thisEl.html(formString);

                template = this.templateDoc({
                    model           : currentModelJSON,
                });

                $thisEl.find('#templateDiv').html(template);


            } else {
                this.$el = $(formString).dialog({
                    autoOpen   : true,
                    dialogClass: 'edit-dialog',
                    title      : 'Edit DailyReport',
                    width      : '1100px',
                    buttons    : buttons
                });

                this.$el.find('.saveBtn').remove();
            }

            this.delegateEvents(this.events);


            if (!this.onlyView/* || this.currentModel.toJSON().status.fulfillStatus !== 'ALL'*/) {

                this.$el.find('#dateStr').datepicker({
                    dateFormat : 'yy-MM-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['1','2','3','4','5','6', '7','8','9','10','11','12'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                    minDate    : new Date()
                });


            }


            if (this.onlyView) {
                this.notEditable = true;
            }

            $('#text1').hide();
            $('#content1').show();
            $('#text2').show();
            $('#review').text(currentModelJSON.review.replace(/<br>/g,"\n"));
            $('#content2').hide();

            if (currentModelJSON.userId == App.currentUser._id && currentModelJSON.status == 'new') {
                $('#text1').show();
                $('#content').text(currentModelJSON.content.replace(/<br>/g,"\n"));
                $('#content1').hide();
                $('#text2').hide();
                $('#content2').show();
            } else if (currentModelJSON.userId == App.currentUser._id) {
                $('#text1').hide();
                $('#content1').show();
                $('#text2').hide();
                $('#content2').show();
            }

            return this;
        }

    });

    return EditView;
});
