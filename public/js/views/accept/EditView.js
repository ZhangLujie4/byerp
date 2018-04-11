define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/accept/EditTemplate.html',
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
            this.currentModel.urlRoot = CONSTANTS.URLS.ACCEPT;
            this.responseObj['#acceptType'] = [
                {
                    _id : 'company',
                    name: '公司自开'
                }, {
                    _id : 'project',
                    name: '项目部交入'
                }, {
                    _id : 'buy',
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

            var mid;
            var data;
            event.preventDefault();
            mid = 39;

            var acceptDate=$.trim(this.$el.find('#acceptDate').val());
            var amount =$.trim(this.$el.find('#amount').val());
            var acceptMan=$.trim(this.$el.find('#acceptMan').val());
            var payDepartment=$.trim(this.$el.find('#payDepartment').val());
            var Department=$.trim(this.$el.find('#Department').val());
            var endDate=$.trim(this.$el.find('#endDate').val());
            var acceptNumber =$.trim(this.$el.find('#acceptNumber').val());
            var payBank=$.trim(this.$el.find('#payBank').val());
            var receiveMan=$.trim(this.$el.find('#receiveMan').val());
            var note=$.trim(this.$el.find('#note').val());
            var payDate=$.trim(this.$el.find('#payDate').val());

            data = {
                acceptDate         :$.trim(this.$el.find('#acceptDate').val()),
                amount             :$.trim(this.$el.find('#amount').val()),
                acceptMan          :$.trim(this.$el.find('#acceptMan').val()),
                payDepartment      :$.trim(this.$el.find('#payDepartment').val()),
                Department         :$.trim(this.$el.find('#Department').val()),
                endDate            :$.trim(this.$el.find('#endDate').val()),
                acceptNumber       :$.trim(this.$el.find('#acceptNumber').val()),
                payBank            :$.trim(this.$el.find('#payBank').val()),
                receiveMan         :$.trim(this.$el.find('#receiveMan').val()),
                note               :$.trim(this.$el.find('#note').val()),
                payDate            :$.trim(this.$el.find('#payDate').val()),
                acceptType         :$.trim(this.$el.find('#acceptType').data('id'))
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
                    $trHolder.eq(1).text(acceptDate);
                    $trHolder.eq(2).text(endDate);
                    $trHolder.eq(3).text(amount );
                    $trHolder.eq(4).text(acceptNumber);
                    $trHolder.eq(5).text(acceptMan);
                    $trHolder.eq(6).text(receiveMan);
                    $trHolder.eq(7).text(payDepartment);
                    $trHolder.eq(8).text(payBank);

                    $trHolder.eq(10).text(note);
                    $trHolder.eq(11).text(Department);


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

            var acceptDate=$.trim(this.$el.find('#acceptDate').val());
            var amount =$.trim(this.$el.find('#amount').val());
            var acceptMan=$.trim(this.$el.find('#acceptMan').val());
            var payDepartment=$.trim(this.$el.find('#payDepartment').val());
            var Department=$.trim(this.$el.find('#Department').val());
            var endDate=$.trim(this.$el.find('#endDate').val());
            var acceptNumber =$.trim(this.$el.find('#acceptNumber').val());
            var payBank=$.trim(this.$el.find('#payBank').val());
            var receiveMan=$.trim(this.$el.find('#receiveMan').val());
            var note=$.trim(this.$el.find('#note').val());
            var payDate=$.trim(this.$el.find('#payDate').val());

            data = {
                acceptDate         :$.trim(this.$el.find('#acceptDate').val()),
                amount             :$.trim(this.$el.find('#amount').val()),
                acceptMan          :$.trim(this.$el.find('#acceptMan').val()),
                payDepartment      :$.trim(this.$el.find('#payDepartment').val()),
                Department         :$.trim(this.$el.find('#Department').val()),
                endDate            :$.trim(this.$el.find('#endDate').val()),
                acceptNumber       :$.trim(this.$el.find('#acceptNumber').val()),
                payBank            :$.trim(this.$el.find('#payBank').val()),
                receiveMan         :$.trim(this.$el.find('#receiveMan').val()),
                note               :$.trim(this.$el.find('#note').val()),
                payDate            :$.trim(this.$el.find('#payDate').val()),
                acceptType         :$.trim(this.$el.find('#acceptType').data('id')),
                acceptState        :"used"
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
                    $trHolder.eq(1).text(acceptDate);
                    $trHolder.eq(2).text(endDate);
                    $trHolder.eq(3).text(amount );
                    $trHolder.eq(4).text(acceptNumber);
                    $trHolder.eq(5).text(acceptMan);
                    $trHolder.eq(6).text(receiveMan);
                    $trHolder.eq(7).text(payDepartment);
                    $trHolder.eq(8).text(payBank);

                    $trHolder.eq(10).text(note);
                    $trHolder.eq(11).text(Department);


                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        render: function () {
            var model=this.currentModel.toJSON();
            model.acceptDate=moment(model.acceptDate).format('YYYY-MM-DD');
            model.endDate=moment(model.endDate).format('YYYY-MM-DD');
            var formString = this.template({
                model:model
            });

            var self = this;

            if(model.acceptState=='unUsed')
            {
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
                            text: '领用',
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
            }else{
                this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog  task-edit-dialog',
                    width: 800,
                    buttons: {
                        save: {
                            text: '保存',
                            class: 'btn blue',
                            click: self.saveItem
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
            }

            this.$el.find('#payDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            }).datepicker('setDate', new Date());

            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
