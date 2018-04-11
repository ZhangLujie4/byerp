define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/borrow/EditTemplate.html',
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
            _.bindAll(this, 'render', 'saveItem', 'deleteItem','use');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();

            this.currentModel.urlRoot = CONSTANTS.URLS.BORROW;

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


            var amount =$.trim(this.$el.find('#amount').val());
            var rate1=$.trim(this.$el.find('#rate1').val());
            var rate2=$.trim(this.$el.find('#rate2').val());
            var rate3=$.trim(this.$el.find('#rate3').val());
            var targetDate=$.trim(this.$el.find('#targetDate').val());


            data = {

                amount             :$.trim(this.$el.find('#amount').val()),
                rate1          :$.trim(this.$el.find('#rate1').val()),
                rate2      :$.trim(this.$el.find('#rate2').val()),
                rate3         :$.trim(this.$el.find('#rate3').val()),
                targetDate:targetDate
            };

            console.log(data)

            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {
                    self.hideDialog();
                    model = model.toJSON();
                    var $trHolder;
                    $trHolder = $("tr[data-id='" + model._id + "'] td");
                    $trHolder.eq(3).text(amount );

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

            console.log(this.currentModel)
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

        use:function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;

            var examine=$.trim(this.$el.find('#examine').val());

            data = {

                examine        :examine
            };

            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {
                    self.hideDialog();
                    model = model.toJSON();
                    var $trHolder;
                    $trHolder = $("tr[data-id='" + model._id + "'] td");
                    $trHolder.eq(8).text(examine);

                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        render: function () {
            var model=this.currentModel.toJSON();
            var formString = this.template({
                model:model
            });
            var self = this;

            console.log(this.currentModel.toJSON())
            if(model.examine=='未审核') {
                this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog  task-edit-dialog',
                    width: 800,
                    buttons: {
                        save: {
                            text: '保存',
                            class: 'btn blue',
                            click: self.saveItem
                        },
                        use: {
                            text: '审核',
                            class: 'btn blue',
                            click: self.use
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
            } else {
                this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog  task-edit-dialog',
                    width: 800,
                    buttons: {
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
            }


            this.$el.find('#day').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            });

            this.$el.find('#targetDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
