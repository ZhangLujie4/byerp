define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/bankInfo/EditTemplate.html',
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
            _.bindAll(this, 'render', 'saveItem', 'deleteItem','check','come');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();

            this.currentModel.urlRoot = CONSTANTS.URLS.BANKINFO;
            this.responseObj['#acceptType'] = [
                {
                    _id : '公司自开',
                    name: '公司自开'
                }, {
                    _id : '项目部交入',
                    name: '项目部交入'
                }, {
                    _id : '买入',
                    name: '买入'
                }
            ];
            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (event) {
            var self = this;
           // var model=this.currentModel.toJSON();
            var mid;
            var data;
            event.preventDefault();
            mid = 39;


            var debit=$.trim(this.$el.find('#debit').val());
            var credit=$.trim(this.$el.find('#credit').val());
            var balance;
            balance=debit-credit;

            data = {
                debit            :$.trim(this.$el.find('#debit').val()),
                credit           :$.trim(this.$el.find('#credit').val()),
                viewType          :"bankInfo"
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
             if(model.account.account=='结算中心'){
                 $trHolder = $("tr[data-id='" + model._id + "'] td");
                 $trHolder.eq(3).text(debit);
                 $trHolder.eq(5).text(credit);
                 $trHolder.eq(6).text(balance);
             } else {
                 $trHolder = $("tr[data-id='" + model._id + "'] td");
                 $trHolder.eq(3).text(debit);
                 $trHolder.eq(4).text(credit);
                 $trHolder.eq(5).text(balance);
             }
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
                        console.log(123)
                        $("tr[data-id='" + model._id + "'] td").remove();
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                        self.hideDialog();
                    },

                    error: function (model, xhr) {
                        console.log(123)
                        self.errorNotification(xhr);
                    }
                });
            }
        },

        check:function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;

            var states =$.trim(this.$el.find('#states').val());
            var choice=$.trim(this.$el.find("[name='check']:checked").attr('data-value'));
            states=choice+','+states;


            data = {
                states             :states,
                viewType     :"bankInfo"
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
                    if(model.account.account=='结算中心'){
                    $trHolder.eq(7).text(states);
                    } else{
                        $trHolder.eq(6).text(states);
                    }
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        come:function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;


            data = {

                state:"已到单",
                viewType:"bankInfo"
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
                    $trHolder.eq(4).text("已到单");
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        render: function () {
            var model=this.currentModel.toJSON();
            model.journal.date=moment(model.journal.date).format('YYYY-MM-DD');
            var formString = this.template({
                model:model
            });

            var self = this;

            console.log(this.currentModel.toJSON())

            if(model.account.account=='结算中心' && model.state=='未到单')
            {
                if(model.states=='未审核'){
                    this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog  task-edit-dialog',
                    width: 500,
                    buttons: {
                        save: {
                            text: '保存',
                            class: 'btn blue',
                            click: self.saveItem
                        },
                        come: {
                            text: '到单',
                            class: 'btn blue',
                            click: self.come
                        },
                        check: {
                            text: '审核',
                            class: 'btn blue',
                            click: self.check
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
                }else{
                this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog  task-edit-dialog',
                    width: 500,
                    buttons: {
                        cancel: {
                            text: '取消',
                            class: 'btn',
                            click: self.hideDialog
                        }
                    }
                });
                }
            } else {
                if(model.states=='未审核'){
                    this.$el = $(formString).dialog({
                        dialogClass: 'edit-dialog  task-edit-dialog',
                        width: 500,
                        buttons: {
                            save: {
                                text: '保存',
                                class: 'btn blue',
                                click: self.saveItem
                            },
                            check: {
                                text: '审核',
                                class: 'btn blue',
                                click: self.check
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
                } else{
                    this.$el = $(formString).dialog({
                        dialogClass: 'edit-dialog  task-edit-dialog',
                        width: 500,
                        buttons: {
                            cancel: {
                                text: '取消',
                                class: 'btn',
                                click: self.hideDialog
                            }
                        }
                    });
                }
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

            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
